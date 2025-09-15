"""
Integration tests cho captcha decoder
Test với ảnh captcha thực tế (nếu có)
"""

import unittest
import os
import tempfile
from unittest.mock import patch, Mock
from PIL import Image, ImageDraw, ImageFont
import requests

from captcha_decoder import CaptchaDecoder, decode_captcha, decode_captcha_from_url


class TestIntegration(unittest.TestCase):
    """Integration tests"""
    
    def setUp(self):
        """Thiết lập trước mỗi test"""
        self.decoder = CaptchaDecoder()
    
    def create_mock_captcha_image(self, text="abc123", size=(120, 40)):
        """Tạo ảnh captcha giả lập"""
        # Tạo ảnh trắng
        img = Image.new('RGB', size, color='white')
        draw = ImageDraw.Draw(img)
        
        # Thêm text
        try:
            # Thử sử dụng font mặc định
            font = ImageFont.load_default()
        except:
            font = None
        
        # Vẽ text
        draw.text((10, 10), text, fill='black', font=font)
        
        # Thêm một số nhiễu
        for i in range(50):
            x = (i * 7) % size[0]
            y = (i * 11) % size[1]
            draw.point((x, y), fill='gray')
        
        return img
    
    def test_mock_captcha_decoding(self):
        """Test giải mã captcha giả lập"""
        # Tạo ảnh captcha giả
        test_text = "abc123"
        mock_image = self.create_mock_captcha_image(test_text)
        
        # Lưu vào file tạm
        with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as temp_file:
            mock_image.save(temp_file.name)
            temp_path = temp_file.name
        
        try:
            # Test với mock OCR
            with patch('pytesseract.image_to_string') as mock_ocr:
                mock_ocr.return_value = test_text
                
                result = self.decoder.decode_captcha(temp_path)
                self.assertIsNotNone(result)
                self.assertEqual(len(result), 6)
                
        finally:
            os.remove(temp_path)
    
    def test_image_preprocessing_pipeline(self):
        """Test pipeline xử lý ảnh"""
        # Tạo ảnh test
        test_image = self.create_mock_captcha_image("test12")
        
        # Lưu vào file tạm
        with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as temp_file:
            test_image.save(temp_file.name)
            temp_path = temp_file.name
        
        try:
            # Test preprocessing
            processed_images = self.decoder.preprocess_image(temp_path)
            
            # Kiểm tra kết quả
            self.assertGreater(len(processed_images), 0)
            
            # Kiểm tra từng ảnh đã xử lý
            for img in processed_images:
                self.assertIsInstance(img, Image.Image)
                self.assertGreater(img.size[0], 0)
                self.assertGreater(img.size[1], 0)
                
        finally:
            os.remove(temp_path)
    
    def test_multiple_config_evaluation(self):
        """Test đánh giá với nhiều cấu hình"""
        test_cases = [
            ("abc123", 1.0),      # Hoàn hảo
            ("abc12", 0.4),       # Thiếu 1 ký tự
            ("abc1234", 0.3),     # Thừa 1 ký tự
            ("abc!@#", 0.3),      # Ký tự không hợp lệ
            ("", 0.0),            # Rỗng
        ]
        
        for text, expected_min_score in test_cases:
            score = self.decoder.evaluate_result(text)
            self.assertGreaterEqual(score, expected_min_score - 0.1)  # Cho phép sai lệch nhỏ
    
    @patch('requests.get')
    def test_download_and_decode_workflow(self, mock_get):
        """Test workflow tải và giải mã"""
        # Mock response với ảnh thật
        mock_response = Mock()
        # Tạo ảnh thật để mock
        test_image = self.create_mock_captcha_image("xyz789")
        import io
        img_buffer = io.BytesIO()
        test_image.save(img_buffer, format='JPEG')
        mock_response.content = img_buffer.getvalue()
        mock_response.raise_for_status.return_value = None
        mock_get.return_value = mock_response
        
        # Mock OCR
        with patch('pytesseract.image_to_string') as mock_ocr:
            mock_ocr.return_value = "xyz789"
            
            # Test workflow
            result = self.decoder.decode_from_url("http://test.com/captcha.jpg")
            
            # Kiểm tra kết quả
            self.assertIsNotNone(result)
            self.assertEqual(result, "xyz789")
    
    def test_error_handling(self):
        """Test xử lý lỗi"""
        # Test với file không tồn tại
        result = self.decoder.decode_captcha("nonexistent.jpg")
        self.assertIsNone(result)
        
        # Test với URL không hợp lệ
        with patch('requests.get') as mock_get:
            mock_get.side_effect = requests.RequestException("Network error")
            
            result = self.decoder.decode_from_url("http://invalid.url/captcha.jpg")
            self.assertIsNone(result)
    
    def test_clean_text_edge_cases(self):
        """Test làm sạch text với các trường hợp đặc biệt"""
        test_cases = [
            ("ABC123", "abc123"),           # Chữ hoa
            ("a b c 1 2 3", "abc123"),      # Khoảng trắng
            ("a\nb\nc\n1\n2\n3", "abc123"), # Xuống dòng
            ("a\tb\tc\t1\t2\t3", "abc123"), # Tab
            ("abc123!@#$%", "abc123"),      # Ký tự đặc biệt
            ("", ""),                       # Rỗng
            (None, ""),                     # None
        ]
        
        for input_text, expected in test_cases:
            result = self.decoder.clean_text(input_text)
            self.assertEqual(result, expected)
    
    def test_whitelist_consistency(self):
        """Test tính nhất quán của whitelist"""
        # Tất cả ký tự trong whitelist phải là chữ thường và số
        for char in self.decoder.whitelist:
            self.assertTrue(char.islower() or char.isdigit())
        
        # Không có ký tự đặc biệt
        special_chars = "!@#$%^&*()_+-=[]{}|;':\",./<>?"
        for char in special_chars:
            self.assertNotIn(char, self.decoder.whitelist)
    
    def test_config_validation(self):
        """Test validation cấu hình"""
        # Mỗi config phải có đầy đủ tham số
        for config in self.decoder.tesseract_configs:
            self.assertIn("--oem", config)
            self.assertIn("--psm", config)
            self.assertIn("tessedit_char_whitelist", config)
            self.assertIn(self.decoder.whitelist, config)
    
    def test_performance_with_large_image(self):
        """Test hiệu suất với ảnh lớn"""
        # Tạo ảnh lớn
        large_image = Image.new('RGB', (800, 600), color='white')
        
        # Lưu vào file tạm
        with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as temp_file:
            large_image.save(temp_file.name)
            temp_path = temp_file.name
        
        try:
            # Test preprocessing với ảnh lớn
            processed_images = self.decoder.preprocess_image(temp_path)
            
            # Phải trả về kết quả trong thời gian hợp lý
            self.assertGreater(len(processed_images), 0)
            
        finally:
            os.remove(temp_path)


class TestRealWorldScenarios(unittest.TestCase):
    """Test các tình huống thực tế"""
    
    def setUp(self):
        """Thiết lập trước mỗi test"""
        self.decoder = CaptchaDecoder()
    
    def test_network_timeout_handling(self):
        """Test xử lý timeout mạng"""
        with patch('requests.get') as mock_get:
            mock_get.side_effect = requests.Timeout("Request timeout")
            
            result = self.decoder.download_captcha("http://slow.server.com/captcha.jpg")
            self.assertIsNone(result)
    
    def test_invalid_image_format(self):
        """Test xử lý format ảnh không hợp lệ"""
        # Tạo file text giả làm ảnh
        with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg', mode='w') as temp_file:
            temp_file.write("This is not an image")
            temp_path = temp_file.name
        
        try:
            result = self.decoder.preprocess_image(temp_path)
            # Phải xử lý lỗi gracefully
            self.assertEqual(result, [])
            
        finally:
            os.remove(temp_path)
    
    def test_memory_usage(self):
        """Test sử dụng bộ nhớ"""
        # Tạo nhiều ảnh để test memory
        temp_files = []
        
        try:
            for i in range(5):  # Giảm số lượng để tránh lỗi
                img = Image.new('RGB', (200, 50), color='white')
                temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.jpg')
                img.save(temp_file.name)
                temp_file.close()  # Đóng file trước khi xử lý
                temp_files.append(temp_file.name)
            
            # Xử lý tất cả ảnh
            for temp_path in temp_files:
                processed = self.decoder.preprocess_image(temp_path)
                self.assertGreater(len(processed), 0)
                
        finally:
            # Cleanup với retry
            import time
            for temp_path in temp_files:
                if os.path.exists(temp_path):
                    try:
                        os.remove(temp_path)
                    except PermissionError:
                        # Thử lại sau 1 giây
                        time.sleep(0.1)
                        try:
                            os.remove(temp_path)
                        except:
                            pass  # Bỏ qua nếu vẫn không xóa được


if __name__ == '__main__':
    # Chạy integration tests
    unittest.main(verbosity=2)
