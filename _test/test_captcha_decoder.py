"""
Test suite cho module captcha_decoder
"""

import unittest
import os
import tempfile
from unittest.mock import Mock, patch, MagicMock
from PIL import Image
import requests

# Import module cần test
from captcha_decoder import CaptchaDecoder, decode_captcha, decode_captcha_from_url


class TestCaptchaDecoder(unittest.TestCase):
    """Test class cho CaptchaDecoder"""
    
    def setUp(self):
        """Thiết lập trước mỗi test"""
        self.decoder = CaptchaDecoder()
        
        # Tạo ảnh test đơn giản
        self.test_image = Image.new('RGB', (100, 30), color='white')
        
    def test_init(self):
        """Test khởi tạo CaptchaDecoder"""
        self.assertEqual(self.decoder.whitelist, "abcdefghijklmnopqrstuvwxyz0123456789")
        self.assertEqual(self.decoder.expected_length, 6)
        self.assertGreater(len(self.decoder.tesseract_configs), 0)
    
    def test_clean_text(self):
        """Test function làm sạch text"""
        # Test với text hợp lệ
        result = self.decoder.clean_text("abc123")
        self.assertEqual(result, "abc123")
        
        # Test với text có ký tự không hợp lệ
        result = self.decoder.clean_text("abc123!@#")
        self.assertEqual(result, "abc123")
        
        # Test với text có khoảng trắng
        result = self.decoder.clean_text("a b c 1 2 3")
        self.assertEqual(result, "abc123")
        
        # Test với text rỗng
        result = self.decoder.clean_text("")
        self.assertEqual(result, "")
        
        # Test với text None
        result = self.decoder.clean_text(None)
        self.assertEqual(result, "")
    
    def test_evaluate_result(self):
        """Test function đánh giá kết quả"""
        # Test với kết quả hoàn hảo
        score = self.decoder.evaluate_result("abc123")
        self.assertEqual(score, 1.0)
        
        # Test với kết quả đúng độ dài nhưng có ký tự không hợp lệ
        score = self.decoder.evaluate_result("abc!@#")
        self.assertLess(score, 1.0)
        
        # Test với kết quả sai độ dài
        score = self.decoder.evaluate_result("abc12")
        self.assertLess(score, 1.0)
        
        # Test với text rỗng
        score = self.decoder.evaluate_result("")
        self.assertEqual(score, 0.0)
    
    @patch('requests.get')
    def test_download_captcha_success(self, mock_get):
        """Test tải captcha thành công"""
        # Mock response
        mock_response = Mock()
        mock_response.content = b'fake_image_data'
        mock_response.raise_for_status.return_value = None
        mock_get.return_value = mock_response
        
        # Test
        with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as temp_file:
            temp_path = temp_file.name
        
        try:
            result = self.decoder.download_captcha("http://test.com/captcha.jpg")
            self.assertIsNotNone(result)
            self.assertTrue(os.path.exists(result))
        finally:
            # Cleanup
            if os.path.exists(temp_path):
                os.remove(temp_path)
    
    @patch('requests.get')
    def test_download_captcha_failure(self, mock_get):
        """Test tải captcha thất bại"""
        # Mock lỗi
        mock_get.side_effect = requests.RequestException("Network error")
        
        result = self.decoder.download_captcha("http://test.com/captcha.jpg")
        self.assertIsNone(result)
    
    def test_preprocess_image(self):
        """Test tiền xử lý ảnh"""
        # Tạo file ảnh tạm
        with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as temp_file:
            self.test_image.save(temp_file.name)
            temp_path = temp_file.name
        
        try:
            processed_images = self.decoder.preprocess_image(temp_path)
            self.assertGreater(len(processed_images), 0)
            self.assertIsInstance(processed_images[0], Image.Image)
        finally:
            os.remove(temp_path)
    
    def test_preprocess_image_nonexistent(self):
        """Test tiền xử lý ảnh không tồn tại"""
        result = self.decoder.preprocess_image("nonexistent.jpg")
        self.assertEqual(result, [])
    
    @patch('pytesseract.image_to_string')
    def test_decode_captcha_success(self, mock_ocr):
        """Test giải mã captcha thành công"""
        # Mock OCR result
        mock_ocr.return_value = "abc123"
        
        # Tạo file ảnh tạm
        with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as temp_file:
            self.test_image.save(temp_file.name)
            temp_path = temp_file.name
        
        try:
            result = self.decoder.decode_captcha(temp_path)
            self.assertEqual(result, "abc123")
        finally:
            os.remove(temp_path)
    
    def test_decode_captcha_nonexistent_file(self):
        """Test giải mã captcha với file không tồn tại"""
        result = self.decoder.decode_captcha("nonexistent.jpg")
        self.assertIsNone(result)
    
    @patch('pytesseract.image_to_string')
    def test_decode_captcha_no_result(self, mock_ocr):
        """Test giải mã captcha không có kết quả"""
        # Mock OCR result rỗng
        mock_ocr.return_value = ""
        
        # Tạo file ảnh tạm
        with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as temp_file:
            self.test_image.save(temp_file.name)
            temp_path = temp_file.name
        
        try:
            result = self.decoder.decode_captcha(temp_path)
            self.assertIsNone(result)
        finally:
            os.remove(temp_path)
    
    @patch.object(CaptchaDecoder, 'download_captcha')
    @patch.object(CaptchaDecoder, 'decode_captcha')
    def test_decode_from_url_success(self, mock_decode, mock_download):
        """Test giải mã từ URL thành công"""
        # Mock
        mock_download.return_value = "temp_captcha.jpg"
        mock_decode.return_value = "abc123"
        
        result = self.decoder.decode_from_url("http://test.com/captcha.jpg")
        self.assertEqual(result, "abc123")
        
        # Verify calls
        mock_download.assert_called_once_with("http://test.com/captcha.jpg")
        mock_decode.assert_called_once_with("temp_captcha.jpg")
    
    @patch.object(CaptchaDecoder, 'download_captcha')
    def test_decode_from_url_download_failure(self, mock_download):
        """Test giải mã từ URL khi tải thất bại"""
        # Mock download failure
        mock_download.return_value = None
        
        result = self.decoder.decode_from_url("http://test.com/captcha.jpg")
        self.assertIsNone(result)


class TestUtilityFunctions(unittest.TestCase):
    """Test các function tiện ích"""
    
    def setUp(self):
        """Thiết lập trước mỗi test"""
        self.test_image = Image.new('RGB', (100, 30), color='white')
    
    @patch('captcha_decoder.CaptchaDecoder')
    def test_decode_captcha_function(self, mock_decoder_class):
        """Test function decode_captcha"""
        # Mock decoder instance
        mock_decoder = Mock()
        mock_decoder.decode_captcha.return_value = "abc123"
        mock_decoder_class.return_value = mock_decoder
        
        result = decode_captcha("test.jpg")
        self.assertEqual(result, "abc123")
        mock_decoder.decode_captcha.assert_called_once_with("test.jpg")
    
    @patch('captcha_decoder.CaptchaDecoder')
    def test_decode_captcha_from_url_function(self, mock_decoder_class):
        """Test function decode_captcha_from_url"""
        # Mock decoder instance
        mock_decoder = Mock()
        mock_decoder.decode_from_url.return_value = "abc123"
        mock_decoder_class.return_value = mock_decoder
        
        result = decode_captcha_from_url("http://test.com/captcha.jpg")
        self.assertEqual(result, "abc123")
        mock_decoder.decode_from_url.assert_called_once_with("http://test.com/captcha.jpg")


class TestIntegration(unittest.TestCase):
    """Test tích hợp"""
    
    def setUp(self):
        """Thiết lập trước mỗi test"""
        self.decoder = CaptchaDecoder()
    
    def test_whitelist_validation(self):
        """Test validation whitelist"""
        # Test các ký tự hợp lệ
        valid_chars = "abcdefghijklmnopqrstuvwxyz0123456789"
        for char in valid_chars:
            self.assertIn(char, self.decoder.whitelist)
        
        # Test các ký tự không hợp lệ
        invalid_chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%^&*()"
        for char in invalid_chars:
            self.assertNotIn(char, self.decoder.whitelist)
    
    def test_tesseract_configs_format(self):
        """Test format của tesseract configs"""
        for config in self.decoder.tesseract_configs:
            # Kiểm tra config có chứa whitelist
            self.assertIn("tessedit_char_whitelist", config)
            self.assertIn(self.decoder.whitelist, config)
            
            # Kiểm tra config có chứa oem và psm
            self.assertIn("--oem", config)
            self.assertIn("--psm", config)
    
    def test_evaluation_consistency(self):
        """Test tính nhất quán của evaluation"""
        # Kết quả hoàn hảo phải có điểm cao nhất
        perfect_score = self.decoder.evaluate_result("abc123")
        
        # Các kết quả khác phải có điểm thấp hơn
        shorter_score = self.decoder.evaluate_result("abc12")
        longer_score = self.decoder.evaluate_result("abc1234")
        invalid_score = self.decoder.evaluate_result("abc!@#")
        
        self.assertGreater(perfect_score, shorter_score)
        self.assertGreater(perfect_score, longer_score)
        self.assertGreater(perfect_score, invalid_score)


if __name__ == '__main__':
    # Chạy tests
    unittest.main(verbosity=2)
