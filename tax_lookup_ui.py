import os
import tkinter as tk
from tkinter import messagebox, scrolledtext
from PIL import Image, ImageTk
import requests
from curl_cffi import requests as cf_requests
import urllib3
import json
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
import pickle
import numpy as np

# Bỏ qua cảnh báo SSL
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

MODEL_SAVE_PATH = "captcha_model.h5"
VOCAB_SAVE_PATH = "vocab.pkl"
TEMP_CAPTCHA = "temp_captcha.jpg"

IMG_WIDTH = 200
IMG_HEIGHT = 50

class TaxLookupUI:
    def __init__(self, root):
        self.root = root
        self.root.title("Công cụ Tra cứu Mã số Thuế (Auto CAPTCHA)")
        self.root.geometry("700x550")
        
        # Biến lưu trữ Model
        self.model = None
        self.char_to_num = None
        self.num_to_char = None
        self.max_length = 0
        
        self.setup_ui()
        
        # Tải mô hình AI khi khởi động
        self.root.after(100, self.load_model_and_vocab)

    def setup_ui(self):
        # Frame Nhập liệu
        input_frame = tk.Frame(self.root)
        input_frame.pack(pady=20)
        
        tk.Label(input_frame, text="Nhập Mã Số Thuế:", font=("Helvetica", 14)).pack(side=tk.LEFT, padx=10)
        self.tin_entry = tk.Entry(input_frame, font=("Helvetica", 14), width=20)
        self.tin_entry.pack(side=tk.LEFT, padx=10)
        self.tin_entry.bind("<Return>", lambda e: self.perform_lookup())
        
        self.search_btn = tk.Button(input_frame, text="Tra cứu", font=("Helvetica", 12, "bold"), bg="#4CAF50", fg="white", command=self.perform_lookup)
        self.search_btn.pack(side=tk.LEFT, padx=10)
        
        # Trạng thái tải model
        self.status_label = tk.Label(self.root, text="Đang khởi tạo mô hình AI...", fg="grey", font=("Helvetica", 10))
        self.status_label.pack()
        
        # Vùng hiển thị CAPTCHA (Để debug/theo dõi)
        captcha_frame = tk.Frame(self.root)
        captcha_frame.pack(pady=10)
        tk.Label(captcha_frame, text="CAPTCHA Session:").pack(side=tk.LEFT)
        self.captcha_img_label = tk.Label(captcha_frame)
        self.captcha_img_label.pack(side=tk.LEFT, padx=10)
        self.captcha_text_label = tk.Label(captcha_frame, text="", font=("Helvetica", 12, "bold"), fg="blue")
        self.captcha_text_label.pack(side=tk.LEFT, padx=10)
        
        # Vùng hiển thị Kết quả
        self.result_text = scrolledtext.ScrolledText(self.root, width=80, height=18, font=("Consolas", 11))
        self.result_text.pack(pady=10, padx=20)

    def load_model_and_vocab(self):
        if not os.path.exists(MODEL_SAVE_PATH) or not os.path.exists(VOCAB_SAVE_PATH):
            self.status_label.config(text="Lỗi: Không tìm thấy model. Hãy huấn luyện trước.", fg="red")
            messagebox.showerror("Lỗi", "Không tìm thấy file mô hình!")
            return
            
        try:
            with open(VOCAB_SAVE_PATH, 'rb') as f:
                data = pickle.load(f)
            vocab = data['vocab']
            self.max_length = data['max_length']
            
            self.char_to_num = layers.StringLookup(vocabulary=vocab, mask_token=None)
            self.num_to_char = layers.StringLookup(vocabulary=self.char_to_num.get_vocabulary(), mask_token=None, invert=True)

            self.model = keras.models.load_model(MODEL_SAVE_PATH)
            self.status_label.config(text="Khởi tạo AI thành công! Sẵn sàng tra cứu.", fg="green")
        except Exception as e:
            self.status_label.config(text=f"Lỗi khởi tạo AI: {e}", fg="red")

    def decode_predictions(self, pred):
        input_len = np.ones(pred.shape[0]) * pred.shape[1]
        results = keras.backend.ctc_decode(pred, input_length=input_len, greedy=True)[0][0][:, :self.max_length]
        
        output_text = []
        for res in results:
            res = tf.strings.reduce_join(self.num_to_char(res)).numpy().decode("utf-8")
            res = res.replace('[UNK]', '')
            output_text.append(res)
        return output_text[0]

    def solve_captcha_image(self, img_path):
        img = tf.io.read_file(img_path)
        img = tf.io.decode_jpeg(img, channels=1)
        img = tf.image.convert_image_dtype(img, tf.float32)
        img = tf.image.resize(img, [IMG_HEIGHT, IMG_WIDTH])
        img = tf.transpose(img, perm=[1, 0, 2])
        img = tf.expand_dims(img, axis=0)
        
        preds = self.model.predict(img, verbose=0)
        pred_text = self.decode_predictions(preds)
        return pred_text

    def display_message(self, msg, clear=False):
        if clear:
            self.result_text.delete(1.0, tk.END)
        self.result_text.insert(tk.END, msg + "\n")
        self.result_text.see(tk.END)
        self.root.update()

    def perform_lookup(self):
        if self.model is None:
            messagebox.showwarning("Cảnh báo", "Mô hình AI chưa được tải thành công!")
            return
            
        tin = self.tin_entry.get().strip()
        if not tin:
            messagebox.showwarning("Cảnh báo", "Vui lòng nhập Mã số thuế!")
            return
            
        self.search_btn.config(state=tk.DISABLED)
        self.display_message("Đang xử lý...", clear=True)
        
        # Bắt đầu tự động lấy session và giải CAPTCHA
        session = cf_requests.Session(impersonate="chrome124")
        captcha_url = "https://tracuuhoadon.gdt.gov.vn/Captcha.jpg"
        
        try:
            # 0. Warm-up
            self.display_message("[0] Khởi tạo phiên kết nối (Warm-up)...")
            session.get("https://tracuuhoadon.gdt.gov.vn/tbphtc.html", verify=False, timeout=10)

            # 1. Tải CAPTCHA & Lưu Cookies Session
            self.display_message("[1] Đang tải CAPTCHA mới từ Tổng cục Thuế...")
            res_captcha = session.get(captcha_url, verify=False, timeout=10)
            
            if len(res_captcha.content) < 100 or res_captcha.content[:2] != b'\xff\xd8':
                self.display_message("Lỗi: Server từ chối cấp CAPTCHA (WAF block).")
                self.search_btn.config(state=tk.NORMAL)
                return
                
            with open(TEMP_CAPTCHA, 'wb') as f:
                f.write(res_captcha.content)
                
            # Hiển thị ảnh lên giao diện
            img_ui = Image.open(TEMP_CAPTCHA)
            photo = ImageTk.PhotoImage(img_ui)
            self.captcha_img_label.config(image=photo)
            self.captcha_img_label.image = photo
            
            # 2. Giải mã CAPTCHA bằng AI cục bộ
            self.display_message("[2] Đang dùng AI giải mã CAPTCHA...")
            captcha_code = self.solve_captcha_image(TEMP_CAPTCHA)
            self.captcha_text_label.config(text=f"[{captcha_code}]")
            self.display_message(f"    -> Kết quả giải mã: {captcha_code}")
            
            # 3. Gọi API lấy thông tin
            self.display_message(f"[3] Gửi Request tra cứu MST: {tin}...")
            api_url = f"https://tracuuhoadon.gdt.gov.vn/gettin.html?tin={tin}&captchaCode={captcha_code}"
            
            res_api = session.get(api_url, verify=False, timeout=10)
            
            if res_api.status_code == 200:
                try:
                    data = res_api.json()
                    if data.get("tinModel"):
                        info = data["tinModel"]
                        self.display_message("\n=== KẾT QUẢ TRA CỨU THÀNH CÔNG ===")
                        self.display_message(f"Tên công ty : {info.get('norm_name', '')}")
                        self.display_message(f"Mã số thuế  : {info.get('tin', '')}")
                        self.display_message(f"Trạng thái  : {info.get('statusName', '')}")
                        self.display_message(f"Địa chỉ     : {info.get('tran_addr', '')}")
                        self.display_message(f"Cơ quan thuế: {info.get('pay_taxo_name_blhd', '')}")
                        self.display_message(f"Ngày Cấp GCN: {info.get('regi_date', '')}")
                        self.display_message("==================================\n")
                    else:
                        error_msg = data.get("strMess", "Không tìm thấy dữ liệu hoặc CAPTCHA sai.")
                        self.display_message(f"\n[!] THẤT BẠI: {error_msg}")
                        if "captcha" in str(error_msg).lower() or error_msg is None:
                            self.display_message("    (Gợi ý: Do mô hình giải sai CAPTCHA, hãy bấm 'Tra cứu' lại)")
                            
                except json.JSONDecodeError:
                    self.display_message("\nLỗi: Không thể phân tích kết quả trả về từ server (Server không trả về JSON).")
            else:
                self.display_message(f"\nLỗi HTTP {res_api.status_code} khi gọi API.")
                
        except Exception as e:
            self.display_message(f"\nLỗi hệ thống: {e}")
            
        finally:
            self.search_btn.config(state=tk.NORMAL)

if __name__ == "__main__":
    root = tk.Tk()
    # Đưa cửa sổ lên trên cùng
    root.attributes('-topmost', True)
    app = TaxLookupUI(root)
    root.mainloop()
