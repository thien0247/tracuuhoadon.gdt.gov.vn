import os
import tkinter as tk
from tkinter import messagebox
from PIL import Image, ImageTk
import csv

DATASET_DIR = "dataset/images"
LABEL_FILE = "dataset/labels.csv"

class CaptchaLabeler:
    def __init__(self, root):
        self.root = root
        self.root.title("Gán nhãn CAPTCHA")
        
        if not os.path.exists(DATASET_DIR):
            messagebox.showerror("Lỗi", f"Thư mục {DATASET_DIR} không tồn tại!")
            root.destroy()
            return
            
        self.images = [f for f in os.listdir(DATASET_DIR) if f.endswith('.jpg')]
        self.current_idx = 0
        
        self.load_labeled_data()
        
        # Lọc ra các ảnh chưa được gán nhãn
        self.unlabeled_images = [img for img in self.images if img not in self.labeled_data]
        
        if not self.unlabeled_images:
            messagebox.showinfo("Thông báo", "Tất cả ảnh đã được gán nhãn!")
            root.destroy()
            return
            
        self.image_label = tk.Label(root)
        self.image_label.pack(pady=20)
        
        self.entry = tk.Entry(root, font=("Helvetica", 24))
        self.entry.pack(pady=10)
        self.entry.bind("<Return>", self.save_label)
        
        # Thêm nút Bỏ qua để lỡ captcha khó nhìn quá
        self.skip_btn = tk.Button(root, text="Bỏ qua (Hoặc bấm Phím ESC)", command=self.skip_image)
        self.skip_btn.pack(pady=5)
        self.root.bind("<Escape>", lambda e: self.skip_image())
        
        self.progress_label = tk.Label(root, text="")
        self.progress_label.pack(pady=10)
        
        self.show_next_image()
        
    def load_labeled_data(self):
        self.labeled_data = {}
        if os.path.exists(LABEL_FILE):
            with open(LABEL_FILE, 'r', encoding='utf-8') as f:
                reader = csv.reader(f)
                for row in reader:
                    if len(row) == 2:
                        self.labeled_data[row[0]] = row[1]
                        
    def show_next_image(self):
        if self.current_idx < len(self.unlabeled_images):
            img_name = self.unlabeled_images[self.current_idx]
            img_path = os.path.join(DATASET_DIR, img_name)
            
            # Phóng to ảnh để dễ nhìn
            try:
                img = Image.open(img_path)
                img = img.resize((img.width * 2, img.height * 2), Image.Resampling.LANCZOS)
                self.photo = ImageTk.PhotoImage(img)
                self.image_label.config(image=self.photo)
            except Exception as e:
                print(f"Lỗi đọc ảnh {img_path}: {e}")
                self.skip_image()
                return
            
            self.entry.delete(0, tk.END)
            self.entry.focus()
            
            total = len(self.images)
            labeled = len(self.labeled_data)
            self.progress_label.config(text=f"Tiến độ: {labeled}/{total} ảnh (Đang dán nhãn: {img_name})")
        else:
            messagebox.showinfo("Thông báo", "Đã hoàn thành gán nhãn!")
            self.root.destroy()
            
    def save_label(self, event=None):
        label = self.entry.get().strip()
        if not label:
            return
            
        img_name = self.unlabeled_images[self.current_idx]
        
        with open(LABEL_FILE, 'a', encoding='utf-8', newline='') as f:
            writer = csv.writer(f)
            writer.writerow([img_name, label])
            
        self.labeled_data[img_name] = label
        self.current_idx += 1
        self.show_next_image()

    def skip_image(self):
        self.current_idx += 1
        self.show_next_image()

if __name__ == "__main__":
    root = tk.Tk()
    root.geometry("500x350")
    # Đưa cửa sổ lên trên cùng
    root.attributes('-topmost', True)
    app = CaptchaLabeler(root)
    root.mainloop()
