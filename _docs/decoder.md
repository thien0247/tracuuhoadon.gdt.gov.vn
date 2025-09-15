

def solve_captcha_tesseract(self, image_path):
        """Giải captcha bằng Tesseract - Ưu tiên 5 ký tự"""
        try:
            image = Image.open(image_path)
            
            # Cấu hình Tesseract - Chỉ ký tự thường và số
            configs = [
                r'--oem 3 --psm 8 -c tessedit_char_whitelist=0123456789abcdefghijklmnopqrstuvwxyz',
                r'--oem 3 --psm 7 -c tessedit_char_whitelist=0123456789abcdefghijklmnopqrstuvwxyz',
                r'--oem 3 --psm 13 -c tessedit_char_whitelist=0123456789abcdefghijklmnopqrstuvwxyz',
                r'--oem 3 --psm 6 -c tessedit_char_whitelist=0123456789abcdefghijklmnopqrstuvwxyz'
            ]
            
            perfect_5char_results = []
            other_results = []
            
            for i, config in enumerate(configs, 1):
                try:
                    text = pytesseract.image_to_string(image, config=config)
                    clean_text = ''.join(c for c in text if c.isalnum()).strip()
                    
                    print(f"🔍 Config {i}: '{clean_text}' (length: {len(clean_text)})")
                    
                    # Ưu tiên kết quả có đúng 5 ký tự
                    if len(clean_text) == 5:
                        print(f"✅ Perfect 5-char match with config {i}: '{clean_text}'")
                        perfect_5char_results.append(clean_text)
                    elif len(clean_text) > 0:
                        other_results.append((clean_text, len(clean_text)))
                        
                except Exception as e:
                    print(f"❌ Config {i} failed: {e}")
                    continue
            
            # Ưu tiên kết quả 5 ký tự
            if perfect_5char_results:
                result = perfect_5char_results[0]
                print(f"🎯 Selected 5-char result: '{result}'")
                return result
            elif other_results:
                best_result = min(other_results, key=lambda x: abs(x[1] - 5))
                print(f"⚠️  No 5-char result, using closest: '{best_result[0]}' (length: {best_result[1]})")
                return best_result[0]
            else:
                print(f"❌ All Tesseract configs failed")
                return None
            
        except Exception as e:
            print(f"❌ Error solving captcha: {e}")
            return None