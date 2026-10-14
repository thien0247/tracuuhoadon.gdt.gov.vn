import os
import tkinter as tk
from tkinter import messagebox
from PIL import Image, ImageTk
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
import pickle
import numpy as np

DATASET_DIR = "dataset/images"
MODEL_SAVE_PATH = "captcha_model.h5"
VOCAB_SAVE_PATH = "vocab.pkl"

IMG_WIDTH = 200
IMG_HEIGHT = 50

class CaptchaTesterUI:
    def __init__(self, root):
        self.root = root
        self.root.title("Kiểm tra mô hình CAPTCHA")
        
        if not os.path.exists(DATASET_DIR):
            messagebox.showerror("Lỗi", f"Thư mục {DATASET_DIR} không tồn tại!")
            root.destroy()
            return
            
        self.images = [f for f in os.listdir(DATASET_DIR) if f.endswith('.jpg')]
        self.current_idx = 0
        
        if not self.images:
            messagebox.showinfo("Thông báo", "Không có ảnh nào trong thư mục!")
            root.destroy()
            return

        self.model, self.char_to_num, self.num_to_char, self.max_length = self.load_model_and_vocab()
        if self.model is None:
            root.destroy()
            return
            
        # UI Elements
        self.image_label = tk.Label(root)
        self.image_label.pack(pady=20)
        
        self.result_label = tk.Label(root, text="Đang giải mã...", font=("Helvetica", 24, "bold"), fg="blue")
        self.result_label.pack(pady=10)
        
        self.btn_frame = tk.Frame(root)
        self.btn_frame.pack(pady=10)
        
        self.prev_btn = tk.Button(self.btn_frame, text="<< Trước (Phím Trái)", command=self.prev_image, font=("Helvetica", 12))
        self.prev_btn.pack(side=tk.LEFT, padx=10)
        
        self.next_btn = tk.Button(self.btn_frame, text="Tiếp theo >> (Phím Phải)", command=self.next_image, font=("Helvetica", 12))
        self.next_btn.pack(side=tk.LEFT, padx=10)
        
        self.progress_label = tk.Label(root, text="")
        self.progress_label.pack(pady=10)
        
        self.root.bind("<Right>", lambda e: self.next_image())
        self.root.bind("<Left>", lambda e: self.prev_image())
        
        self.show_current_image()

    def load_model_and_vocab(self):
        if not os.path.exists(MODEL_SAVE_PATH) or not os.path.exists(VOCAB_SAVE_PATH):
            messagebox.showerror("Lỗi", "Không tìm thấy model hoặc vocab. Hãy chạy file train_model.py trước.")
            return None, None, None, None
            
        with open(VOCAB_SAVE_PATH, 'rb') as f:
            data = pickle.load(f)
        vocab = data['vocab']
        max_length = data['max_length']
        
        char_to_num = layers.StringLookup(vocabulary=vocab, mask_token=None)
        num_to_char = layers.StringLookup(vocabulary=char_to_num.get_vocabulary(), mask_token=None, invert=True)

        model = keras.models.load_model(MODEL_SAVE_PATH)
        return model, char_to_num, num_to_char, max_length

    def decode_predictions(self, pred):
        input_len = np.ones(pred.shape[0]) * pred.shape[1]
        results = keras.backend.ctc_decode(pred, input_length=input_len, greedy=True)[0][0][:, :self.max_length]
        
        output_text = []
        for res in results:
            res = tf.strings.reduce_join(self.num_to_char(res)).numpy().decode("utf-8")
            res = res.replace('[UNK]', '')
            output_text.append(res)
        return output_text[0]

    def solve(self, img_path):
        img = tf.io.read_file(img_path)
        img = tf.io.decode_jpeg(img, channels=1)
        img = tf.image.convert_image_dtype(img, tf.float32)
        img = tf.image.resize(img, [IMG_HEIGHT, IMG_WIDTH])
        img = tf.transpose(img, perm=[1, 0, 2])
        img = tf.expand_dims(img, axis=0)
        
        preds = self.model.predict(img, verbose=0)
        pred_text = self.decode_predictions(preds)
        return pred_text

    def show_current_image(self):
        img_name = self.images[self.current_idx]
        img_path = os.path.join(DATASET_DIR, img_name)
        
        self.result_label.config(text="Đang tính toán...", fg="grey")
        self.root.update()
        
        # Load and display image
        try:
            img = Image.open(img_path)
            img = img.resize((img.width * 2, img.height * 2), Image.Resampling.LANCZOS)
            self.photo = ImageTk.PhotoImage(img)
            self.image_label.config(image=self.photo)
        except Exception as e:
            print(f"Lỗi đọc ảnh: {e}")
            
        # Predict
        pred_text = self.solve(img_path)
        self.result_label.config(text=f"Dự đoán: {pred_text}", fg="blue")
        
        self.progress_label.config(text=f"Ảnh: {self.current_idx + 1}/{len(self.images)}\n{img_name}")
        
    def next_image(self):
        if self.current_idx < len(self.images) - 1:
            self.current_idx += 1
            self.show_current_image()

    def prev_image(self):
        if self.current_idx > 0:
            self.current_idx -= 1
            self.show_current_image()

if __name__ == "__main__":
    root = tk.Tk()
    root.geometry("600x400")
    # Đưa GUI lên trên cùng
    root.attributes('-topmost', True)
    app = CaptchaTesterUI(root)
    root.mainloop()
