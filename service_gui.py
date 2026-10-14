"""
service_gui.py - Modern Python Tkinter GUI for GDTTaxCrawler Windows Service.
Features dynamic color indicators (Green, Red, Gray), real-time logs, and controls.
"""
import datetime
import os
import threading
import webbrowser
import tkinter as tk
from tkinter import messagebox, scrolledtext, ttk
from service_gui_core import ServiceManager, get_service_status, check_port_listening, APP_DIR

COLOR_RUNNING = "#10B981"   # Green
COLOR_STOPPED = "#EF4444"   # Red
COLOR_GRAY = "#6B7280"      # Gray
BG_DARK = "#1E293B"         # Slate Dark


class ServiceGUI:
    def __init__(self, root: tk.Tk):
        self.root = root
        self.root.title("GDT Tax Crawler - Quản Lý Windows Service")
        self.root.geometry("780x620")
        self.root.minsize(700, 550)
        self.root.configure(bg="#F1F5F9")

        self.mgr = ServiceManager(self.append_log, self.trigger_refresh)
        self.build_ui()
        self.trigger_refresh()
        self.schedule_poll()

    def build_ui(self):
        # Header Banner
        header = tk.Frame(self.root, bg=BG_DARK, padx=16, pady=12)
        header.pack(fill="x")
        tk.Label(header, text="HỆ THỐNG VÉT CẠN MÃ SỐ THUẾ - WINDOWS SERVICE", font=("Segoe UI", 12, "bold"), fg="white", bg=BG_DARK).pack(anchor="w")
        tk.Label(header, text=f"Thư mục: {APP_DIR}", font=("Segoe UI", 9), fg="#94A3B8", bg=BG_DARK).pack(anchor="w")

        # Status Badges Frame
        status_frame = tk.LabelFrame(self.root, text=" Trạng Thái Hệ Thống ", font=("Segoe UI", 10, "bold"), padx=12, pady=10, bg="white")
        status_frame.pack(fill="x", padx=14, pady=8)

        # Service Indicator
        row1 = tk.Frame(status_frame, bg="white")
        row1.pack(fill="x", pady=2)
        tk.Label(row1, text="Dịch vụ (GDTTaxCrawler):", font=("Segoe UI", 9, "bold"), width=24, anchor="w", bg="white").pack(side="left")
        self.lbl_svc_dot = tk.Label(row1, text="●", font=("Segoe UI", 14), fg=COLOR_GRAY, bg="white")
        self.lbl_svc_dot.pack(side="left", padx=4)
        self.lbl_svc_txt = tk.Label(row1, text="Đang kiểm tra...", font=("Segoe UI", 9, "bold"), fg=COLOR_GRAY, bg="white")
        self.lbl_svc_txt.pack(side="left")

        # Ports Indicator
        row2 = tk.Frame(status_frame, bg="white")
        row2.pack(fill="x", pady=2)
        tk.Label(row2, text="Cổng Web (8123):", font=("Segoe UI", 9), width=16, anchor="w", bg="white").pack(side="left")
        self.lbl_p8123_dot = tk.Label(row2, text="●", font=("Segoe UI", 13), fg=COLOR_GRAY, bg="white")
        self.lbl_p8123_dot.pack(side="left", padx=2)
        self.lbl_p8123_txt = tk.Label(row2, text="Chưa kết nối", font=("Segoe UI", 8, "bold"), fg=COLOR_GRAY, bg="white")
        self.lbl_p8123_txt.pack(side="left", padx=2)

        tk.Label(row2, text="Worker (8124):", font=("Segoe UI", 9), width=13, anchor="w", bg="white").pack(side="left", padx=(10, 0))
        self.lbl_p8124_dot = tk.Label(row2, text="●", font=("Segoe UI", 13), fg=COLOR_GRAY, bg="white")
        self.lbl_p8124_dot.pack(side="left", padx=2)
        self.lbl_p8124_txt = tk.Label(row2, text="Chưa kết nối", font=("Segoe UI", 8, "bold"), fg=COLOR_GRAY, bg="white")
        self.lbl_p8124_txt.pack(side="left", padx=2)

        tk.Label(row2, text="PostgreSQL (5433):", font=("Segoe UI", 9), width=16, anchor="w", bg="white").pack(side="left", padx=(10, 0))
        self.lbl_pdb_dot = tk.Label(row2, text="●", font=("Segoe UI", 13), fg=COLOR_GRAY, bg="white")
        self.lbl_pdb_dot.pack(side="left", padx=2)
        self.lbl_pdb_txt = tk.Label(row2, text="Chưa kết nối", font=("Segoe UI", 8, "bold"), fg=COLOR_GRAY, bg="white")
        self.lbl_pdb_txt.pack(side="left", padx=2)

        # Buttons Control Panel
        btn_box = tk.LabelFrame(self.root, text=" Bảng Điều Khiển ", font=("Segoe UI", 10, "bold"), padx=10, pady=8, bg="white")
        btn_box.pack(fill="x", padx=14, pady=4)

        r_actions = tk.Frame(btn_box, bg="white")
        r_actions.pack(fill="x", pady=3)

        self.btn_start = tk.Button(r_actions, text="▶ Start Dịch Vụ", font=("Segoe UI", 9, "bold"), bg="#10B981", fg="white", activebackground="#059669", relief="flat", padx=10, pady=4, command=self.mgr.start)
        self.btn_start.pack(side="left", padx=4)

        self.btn_stop = tk.Button(r_actions, text="⏹ Stop Dịch Vụ", font=("Segoe UI", 9, "bold"), bg="#EF4444", fg="white", activebackground="#DC2626", relief="flat", padx=10, pady=4, command=self.mgr.stop)
        self.btn_stop.pack(side="left", padx=4)

        self.btn_reset = tk.Button(r_actions, text="🔄 Reset Dịch Vụ", font=("Segoe UI", 9, "bold"), bg="#3B82F6", fg="white", activebackground="#2563EB", relief="flat", padx=10, pady=4, command=self.mgr.restart)
        self.btn_reset.pack(side="left", padx=4)

        self.btn_open = tk.Button(r_actions, text="🌐 Mở Web UI", font=("Segoe UI", 9), bg="#6366F1", fg="white", relief="flat", padx=10, pady=4, command=lambda: webbrowser.open("http://localhost:8123"))
        self.btn_open.pack(side="right", padx=4)

        r_mgmt = tk.Frame(btn_box, bg="white")
        r_mgmt.pack(fill="x", pady=4)

        self.btn_install = tk.Button(r_mgmt, text="➕ Đăng Ký Dịch Vụ", font=("Segoe UI", 9), bg="#475569", fg="white", relief="flat", padx=8, pady=3, command=self.mgr.install)
        self.btn_install.pack(side="left", padx=4)

        self.btn_uninstall = tk.Button(r_mgmt, text="🗑️ Gỡ Đăng Ký", font=("Segoe UI", 9), bg="#94A3B8", fg="white", relief="flat", padx=8, pady=3, command=self.mgr.uninstall)
        self.btn_uninstall.pack(side="left", padx=4)

        tk.Button(r_mgmt, text="🔍 Quét Lại", font=("Segoe UI", 9), bg="#E2E8F0", fg="#334155", relief="flat", padx=8, pady=3, command=self.trigger_refresh).pack(side="left", padx=4)
        tk.Button(r_mgmt, text="🧹 Xóa Log", font=("Segoe UI", 9), bg="#E2E8F0", fg="#334155", relief="flat", padx=8, pady=3, command=self.clear_log).pack(side="right", padx=4)

        # Real-time Log Console
        log_frame = tk.LabelFrame(self.root, text=" Nhật Ký Hoạt Động (Real-time Logs) ", font=("Segoe UI", 10, "bold"), padx=6, pady=6, bg="white")
        log_frame.pack(fill="both", expand=True, padx=14, pady=(4, 10))

        self.log_area = scrolledtext.ScrolledText(log_frame, wrap="word", bg="#0F172A", fg="#E2E8F0", font=("Consolas", 9), insertbackground="white")
        self.log_area.pack(fill="both", expand=True)

        self.log_area.tag_config("INFO", foreground="#38BDF8")
        self.log_area.tag_config("SUCCESS", foreground="#4ADE80")
        self.log_area.tag_config("WARNING", foreground="#FBBF24")
        self.log_area.tag_config("ERROR", foreground="#F87171")

    def append_log(self, msg: str, level: str = "INFO"):
        ts = datetime.datetime.now().strftime("%H:%M:%S")
        self.root.after(0, lambda: self._insert_log(f"[{ts}] {msg}\n", level))

    def _insert_log(self, formatted_text: str, level: str):
        self.log_area.insert("end", formatted_text, level)
        self.log_area.see("end")

    def clear_log(self):
        self.log_area.delete("1.0", "end")

    def trigger_refresh(self):
        threading.Thread(target=self._update_status_worker, daemon=True).start()

    def _update_status_worker(self):
        status = get_service_status()
        p8123 = check_port_listening(8123)
        p8124 = check_port_listening(8124)
        pdb = check_port_listening(5433) or check_port_listening(5432)
        self.root.after(0, lambda: self._apply_ui_status(status, p8123, p8124, pdb))

    def _apply_ui_status(self, status: str, p8123: bool, p8124: bool, pdb: bool = False):
        if status == "RUNNING":
            self.lbl_svc_dot.config(fg=COLOR_RUNNING)
            self.lbl_svc_txt.config(text="ĐANG CHẠY (RUNNING)", fg=COLOR_RUNNING)
            self.btn_start.config(state="disabled", bg="#9CA3AF")
            self.btn_stop.config(state="normal", bg="#EF4444")
            self.btn_reset.config(state="normal", bg="#3B82F6")
            self.btn_install.config(state="disabled")
            self.btn_uninstall.config(state="normal")
        elif status == "STOPPED":
            self.lbl_svc_dot.config(fg=COLOR_STOPPED)
            self.lbl_svc_txt.config(text="ĐÃ DỪNG (STOPPED)", fg=COLOR_STOPPED)
            self.btn_start.config(state="normal", bg="#10B981")
            self.btn_stop.config(state="disabled", bg="#9CA3AF")
            self.btn_reset.config(state="disabled", bg="#9CA3AF")
            self.btn_install.config(state="disabled")
            self.btn_uninstall.config(state="normal")
        else:
            self.lbl_svc_dot.config(fg=COLOR_GRAY)
            self.lbl_svc_txt.config(text="CHƯA ĐĂNG KÝ (NOT INSTALLED)", fg=COLOR_GRAY)
            self.btn_start.config(state="disabled", bg="#9CA3AF")
            self.btn_stop.config(state="disabled", bg="#9CA3AF")
            self.btn_reset.config(state="disabled", bg="#9CA3AF")
            self.btn_install.config(state="normal")
            self.btn_uninstall.config(state="disabled")

        # Update Port Badges
        self.lbl_p8123_dot.config(fg=COLOR_RUNNING if p8123 else COLOR_STOPPED)
        self.lbl_p8123_txt.config(text="LẮNG NGHE" if p8123 else "CHƯA KẾT NỐI", fg=COLOR_RUNNING if p8123 else COLOR_STOPPED)

        self.lbl_p8124_dot.config(fg=COLOR_RUNNING if p8124 else COLOR_STOPPED)
        self.lbl_p8124_txt.config(text="LẮNG NGHE" if p8124 else "CHƯA KẾT NỐI", fg=COLOR_RUNNING if p8124 else COLOR_STOPPED)

        self.lbl_pdb_dot.config(fg=COLOR_RUNNING if pdb else COLOR_STOPPED)
        self.lbl_pdb_txt.config(text="KẾT NỐI" if pdb else "CHƯA KẾT NỐI", fg=COLOR_RUNNING if pdb else COLOR_STOPPED)

    def schedule_poll(self):
        self.trigger_refresh()
        self.root.after(3000, self.schedule_poll)


if __name__ == "__main__":
    app_root = tk.Tk()
    app = ServiceGUI(app_root)
    app_root.mainloop()
