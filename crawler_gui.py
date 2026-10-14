"""
crawler_gui.py
Giao diện điều khiển công cụ vét cạn MST Đắk Lắk.
Chạy lệnh: python crawler_gui.py
"""

import tkinter as tk
from tkinter import ttk, scrolledtext, messagebox
import threading
import psycopg2
from datetime import datetime

from crawler_dak_lak import CrawlerEngine, Database, validate_tin

DB_DSN = "postgresql://zzsu:Zzs%40123@localhost:5433/taxdb"

PROVINCES = {}
try:
    with psycopg2.connect(DB_DSN) as conn:
        with conn.cursor() as cursor:
            cursor.execute("SELECT name, prefix, activation_tin FROM provinces")
            for row in cursor.fetchall():
                name, prefix, act_tin = row
                PROVINCES[name] = {"prefix": prefix, "activation_tin": act_tin}
except Exception as e:
    print("Failed to load PROVINCES from DB in GUI:", e)
    # Fallback just in case
    PROVINCES = {
        "Đắk Lắk (60)": {"prefix": "60", "activation_tin": "6001842955"}
    }

class CrawlerGUI:
    def __init__(self, root):
        self.root = root
        self.root.title("Vét cạn MST Đắk Lắk (prefix 60) — Powered by AI CAPTCHA")
        self.root.geometry("900x680")
        self.root.resizable(True, True)
        
        self.engine = None
        self.current_prov = list(PROVINCES.keys())[0]
        self.db = Database(PROVINCES[self.current_prov]["prefix"])
        
        self._build_ui()
        self._refresh_stats()

    # ─── Build UI ────────────────────────────────────────────────────────────
    def _build_ui(self):
        # Header
        self.header_label = tk.Label(self.root, text="🔍 Công cụ Crawler Mã Số Thuế",
                 font=("Helvetica", 16, "bold"), bg="#1a1a2e", fg="white", pady=12)
        self.header_label.pack(fill=tk.X)

        # Thêm Notebook cho các tab
        self.notebook = ttk.Notebook(self.root)
        self.notebook.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)

        # ─── TAB 1: Quét MST ───
        self.tab_scan = ttk.Frame(self.notebook)
        self.notebook.add(self.tab_scan, text="Quét MST")

        # ─── TAB 2: Lọc theo ngày ───
        self.tab_filter = ttk.Frame(self.notebook)
        self.notebook.add(self.tab_filter, text="Lọc theo ngày đăng ký")
        self._build_filter_tab()

        # ─── Province config ───
        prov_frame = tk.Frame(self.tab_scan)
        prov_frame.pack(fill=tk.X, padx=20, pady=(8, 0))
        tk.Label(prov_frame, text="Tỉnh thành:", font=("Helvetica", 11, "bold")).pack(side=tk.LEFT, padx=5)
        self.prov_combo = ttk.Combobox(prov_frame, values=list(PROVINCES.keys()), state="readonly", font=("Helvetica", 11), width=20)
        self.prov_combo.set(self.current_prov)
        self.prov_combo.pack(side=tk.LEFT, padx=5)
        self.prov_combo.bind("<<ComboboxSelected>>", self._on_prov_change)

        # ─── Config frame: Seed TIN + Gap + Luồng ───
        cfg = tk.LabelFrame(self.tab_scan, text="Cấu hình quét", font=("Helvetica", 11), pady=6, padx=10)
        cfg.pack(fill=tk.X, padx=20, pady=(8, 0))

        tk.Label(cfg, text="Seed TIN (MST):", font=("Helvetica", 11)).grid(row=0, column=0, sticky="e", padx=5)
        self.seed_entry = tk.Entry(cfg, font=("Helvetica", 12), width=12)
        self.seed_entry.insert(0, PROVINCES[self.current_prov]["activation_tin"])
        self.seed_entry.grid(row=0, column=1, sticky="w", padx=5)

        tk.Label(cfg, text="Gap:", font=("Helvetica", 11)).grid(row=0, column=2, sticky="e", padx=5)
        self.gap_entry = tk.Entry(cfg, font=("Helvetica", 12), width=6)
        self.gap_entry.insert(0, "5000")
        self.gap_entry.grid(row=0, column=3, sticky="w", padx=5)

        tk.Label(cfg, text="Luồng:", font=("Helvetica", 11)).grid(row=0, column=4, sticky="e", padx=5)
        self.threads_combo = ttk.Combobox(cfg, values=["5", "4", "3", "2", "1"], state="readonly", font=("Helvetica", 11), width=4)
        self.threads_combo.set("5")
        self.threads_combo.grid(row=0, column=5, sticky="w", padx=5)

        # Control frame
        ctrl = tk.Frame(self.tab_scan, pady=8)
        ctrl.pack(fill=tk.X, padx=20)
        self.start_btn = tk.Button(ctrl, text="▶  Start (2 chiều)", font=("Helvetica", 12, "bold"),
                                   bg="#4CAF50", fg="white", width=14, command=lambda: self._on_start(scan_mode="bidirectional"))
        self.start_btn.pack(side=tk.LEFT, padx=5)

        self.start_edges_btn = tk.Button(ctrl, text="▶ Mở rộng Biên DB", font=("Helvetica", 12, "bold"),
                                   bg="#9C27B0", fg="white", width=16, command=lambda: self._on_start(scan_mode="edges"))
        self.start_edges_btn.pack(side=tk.LEFT, padx=5)

        self.start_newest_btn = tk.Button(ctrl, text="▶ Quét Mới Nhất", font=("Helvetica", 12, "bold"),
                                   bg="#00BCD4", fg="white", width=14, command=lambda: self._on_start(scan_mode="newest"))
        self.start_newest_btn.pack(side=tk.LEFT, padx=5)

        self.start_down_btn = tk.Button(ctrl, text="▼ Quét xuống từ Min", font=("Helvetica", 12, "bold"),
                                   bg="#FF5722", fg="white", width=16, command=lambda: self._on_start(scan_mode="down_from_min"))
        self.start_down_btn.pack(side=tk.LEFT, padx=5)

        self.pause_btn = tk.Button(ctrl, text="⏸  Pause", font=("Helvetica", 12),
                                   bg="#FF9800", fg="white", width=10, command=self._on_pause,
                                   state=tk.DISABLED)
        self.pause_btn.pack(side=tk.LEFT, padx=5)

        self.stop_btn = tk.Button(ctrl, text="⏹  Stop", font=("Helvetica", 12),
                                  bg="#f44336", fg="white", width=10, command=self._on_stop,
                                  state=tk.DISABLED)
        self.stop_btn.pack(side=tk.LEFT, padx=5)

        self.export_btn = tk.Button(ctrl, text="💾  Export CSV", font=("Helvetica", 12),
                                    bg="#2196F3", fg="white", width=12, command=self._on_export)
        self.export_btn.pack(side=tk.RIGHT, padx=5)

        # Stats frame
        stats_frame = tk.LabelFrame(self.tab_scan, text="Thống kê tiến độ", font=("Helvetica", 11), pady=6, padx=10)
        stats_frame.pack(fill=tk.X, padx=20, pady=5)

        self.stat_vars = {}
        # Hàng 1: số liệu chính
        stats_row1 = [
            ("Đã quét:",       "queried"),
            ("Đã tìm thấy:",   "found"),
            ("Tốc độ (MST/ph):", "rate"),
        ]
        for i, (lbl, key) in enumerate(stats_row1):
            tk.Label(stats_frame, text=lbl, font=("Helvetica", 10)).grid(row=0, column=i*2, sticky="e", padx=5)
            var = tk.StringVar(value="—")
            self.stat_vars[key] = var
            tk.Label(stats_frame, textvariable=var, font=("Helvetica", 11, "bold"), fg="blue").grid(row=0, column=i*2+1, sticky="w", padx=5)

        # Hàng 2: trạng thái 2 chiều
        tk.Label(stats_frame, text="MST đang quét:", font=("Helvetica", 10)).grid(row=1, column=0, sticky="e", padx=5)
        self.stat_vars["last_tin"] = tk.StringVar(value="—")
        tk.Label(stats_frame, textvariable=self.stat_vars["last_tin"], font=("Helvetica", 10, "bold"), fg="#1565C0").grid(row=1, column=1, sticky="w", padx=5)

        tk.Label(stats_frame, text="Chiều:", font=("Helvetica", 10)).grid(row=1, column=2, sticky="e", padx=5)
        self.stat_vars["direction"] = tk.StringVar(value="—")
        tk.Label(stats_frame, textvariable=self.stat_vars["direction"], font=("Helvetica", 10, "bold"), fg="#6A1B9A").grid(row=1, column=3, sticky="w", padx=5)

        tk.Label(stats_frame, text="Empty streak:", font=("Helvetica", 10)).grid(row=1, column=4, sticky="e", padx=5)
        self.stat_vars["streak"] = tk.StringVar(value="—")
        tk.Label(stats_frame, textvariable=self.stat_vars["streak"], font=("Helvetica", 10, "bold"), fg="#BF360C").grid(row=1, column=5, sticky="w", padx=5)

        # Progress bar (indeterminate dạng)
        self.progress_var = tk.DoubleVar()
        self.progress_label = tk.Label(self.tab_scan, text="Chuẩn bị...", fg="grey")
        self.progress_label.pack()
        self.progress_bar = ttk.Progressbar(self.tab_scan, variable=self.progress_var, maximum=5000, length=860, mode="determinate")
        self.progress_bar.pack(padx=20)

        # Panel: Log | Found list
        panel = tk.Frame(self.tab_scan)
        panel.pack(fill=tk.BOTH, expand=True, padx=20, pady=10)

        # Log output
        log_frame = tk.LabelFrame(panel, text="Log hoạt động", font=("Helvetica", 10))
        log_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        self.log_box = scrolledtext.ScrolledText(log_frame, width=50, height=18, font=("Consolas", 9), state=tk.DISABLED)
        self.log_box.pack(fill=tk.BOTH, expand=True)

        # Found list
        found_frame = tk.LabelFrame(panel, text="MST tìm thấy (mới nhất)", font=("Helvetica", 10))
        found_frame.pack(side=tk.RIGHT, fill=tk.BOTH, expand=True, padx=(10, 0))
        cols = ("tin", "name", "status", "time")
        self.found_tree = ttk.Treeview(found_frame, columns=cols, show="headings", height=18)
        self.found_tree.heading("tin",    text="MST")
        self.found_tree.heading("name",   text="Tên đơn vị")
        self.found_tree.heading("status", text="Trạng thái")
        self.found_tree.heading("time",   text="Thời gian")
        self.found_tree.column("tin",    width=110, anchor="center")
        self.found_tree.column("name",   width=200)
        self.found_tree.column("status", width=90, anchor="center")
        self.found_tree.column("time",   width=80, anchor="center")
        vsb = ttk.Scrollbar(found_frame, orient="vertical", command=self.found_tree.yview)
        self.found_tree.configure(yscroll=vsb.set)
        vsb.pack(side=tk.RIGHT, fill=tk.Y)
        self.found_tree.pack(fill=tk.BOTH, expand=True)

        self._start_time = None
        self._queried_count = 0

    def _build_filter_tab(self):
        # Frame input
        input_frame = tk.Frame(self.tab_filter, pady=10, padx=10)
        input_frame.pack(fill=tk.X)

        tk.Label(input_frame, text="Từ ngày (YYYY-MM-DD):", font=("Helvetica", 11)).grid(row=0, column=0, padx=5, sticky="e")
        self.from_date_entry = tk.Entry(input_frame, font=("Helvetica", 12), width=12)
        self.from_date_entry.grid(row=0, column=1, padx=5)

        tk.Label(input_frame, text="Đến ngày (YYYY-MM-DD):", font=("Helvetica", 11)).grid(row=0, column=2, padx=5, sticky="e")
        self.to_date_entry = tk.Entry(input_frame, font=("Helvetica", 12), width=12)
        self.to_date_entry.grid(row=0, column=3, padx=5)

        self.filter_btn = tk.Button(input_frame, text="🔍 Lọc", font=("Helvetica", 11, "bold"),
                                   bg="#2196F3", fg="white", width=10, command=self._on_filter)
        self.filter_btn.grid(row=0, column=4, padx=10)

        self.export_filter_btn = tk.Button(input_frame, text="💾 Xuất CSV kết quả lọc", font=("Helvetica", 11),
                                          bg="#4CAF50", fg="white", command=self._on_export_filter)
        self.export_filter_btn.grid(row=0, column=5, padx=10)

        self.filter_info_var = tk.StringVar(value="Sẵn sàng lọc.")
        tk.Label(input_frame, textvariable=self.filter_info_var, font=("Helvetica", 10), fg="grey").grid(row=1, column=0, columnspan=6, pady=5, sticky="w")

        # Treeview kết quả lọc
        tree_frame = tk.Frame(self.tab_filter, padx=10, pady=10)
        tree_frame.pack(fill=tk.BOTH, expand=True)

        cols = ("tin", "name", "regi_date", "status")
        self.filter_tree = ttk.Treeview(tree_frame, columns=cols, show="headings")
        self.filter_tree.heading("tin", text="MST")
        self.filter_tree.heading("name", text="Tên đơn vị")
        self.filter_tree.heading("regi_date", text="Ngày đăng ký")
        self.filter_tree.heading("status", text="Trạng thái")

        self.filter_tree.column("tin", width=120, anchor="center")
        self.filter_tree.column("name", width=400)
        self.filter_tree.column("regi_date", width=150, anchor="center")
        self.filter_tree.column("status", width=120, anchor="center")

        vsb = ttk.Scrollbar(tree_frame, orient="vertical", command=self.filter_tree.yview)
        self.filter_tree.configure(yscroll=vsb.set)
        vsb.pack(side=tk.RIGHT, fill=tk.Y)
        self.filter_tree.pack(fill=tk.BOTH, expand=True)

        self.filtered_rows = []

    def _on_filter(self):
        from_date = self.from_date_entry.get().strip()
        to_date = self.to_date_entry.get().strip()

        if not from_date or not to_date:
            messagebox.showwarning("Thiếu dữ liệu", "Vui lòng nhập cả Từ ngày và Đến ngày!")
            return

        # Format DB có thể chứa Time (e.g. 2026-06-15T00:00:00). Ta có thể lọc dùng LIKE hoặc chuỗi so sánh.
        # So sánh chuỗi cho ngày ISO khá an toàn. Thêm T để đảm bảo đúng format thời gian.
        try:
            with psycopg2.connect("postgresql://zzsu:Zzs%40123@localhost:5433/taxdb") as conn:
                with conn.cursor() as cursor:
                    cursor.execute(
                        "SELECT * FROM tax_records "
                        "WHERE tin LIKE %s AND regi_date >= %s AND regi_date <= %s ORDER BY regi_date DESC",
                        (PROVINCES[self.current_prov]["prefix"] + '%', f"{from_date}T00:00:00", f"{to_date}T23:59:59")
                    )
                    self.filtered_rows = cursor.fetchall()
                    self.filtered_headers = [d[0] for d in cursor.description]
        except Exception as e:
            messagebox.showerror("Lỗi CSDL", str(e))
            return

        # Xóa dữ liệu cũ trên cây
        for item in self.filter_tree.get_children():
            self.filter_tree.delete(item)

        # Chèn dữ liệu mới vào Treeview (chỉ hiển thị 4 cột: tin, norm_name, regi_date, status_name)
        # Dựa theo cấu trúc DB: tin=0, norm_name=1, status_name=3, regi_date=13
        for row in self.filtered_rows:
            display_row = (row[0], row[1], row[13], row[3]) if len(row) > 13 else row[:4]
            self.filter_tree.insert("", tk.END, values=display_row)

        self.filter_info_var.set(f"Tìm thấy {len(self.filtered_rows)} kết quả từ {from_date} đến {to_date}.")

    def _on_export_filter(self):
        if not hasattr(self, 'filtered_rows') or not self.filtered_rows:
            messagebox.showinfo("Trống", "Không có dữ liệu để xuất. Vui lòng lọc trước.")
            return

        import csv
        filename = f"filtered_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        try:
            with open(filename, 'w', newline='', encoding='utf-8-sig') as f:
                w = csv.writer(f)
                w.writerow(self.filtered_headers)
                w.writerows(self.filtered_rows)
            messagebox.showinfo("Export OK", f"Đã xuất {len(self.filtered_rows)} bản ghi ra:\n{filename}")
        except Exception as e:
            messagebox.showerror("Lỗi", str(e))

    def _on_prov_change(self, event):
        self.current_prov = self.prov_combo.get()
        cfg = PROVINCES[self.current_prov]
        self.db = Database(cfg["db"])
        
        self.seed_entry.delete(0, tk.END)
        self.seed_entry.insert(0, cfg["activation_tin"])
        self._log(f"Chuyển sang tỉnh: {self.current_prov}. DB: {cfg['db']}")
        self._refresh_stats()

    # ─── Event Handlers ──────────────────────────────────────────────────────
    def _on_start(self, scan_mode="bidirectional"):
        if self.engine and self.engine._running and self.engine._paused:
            self.engine.resume()
            self.pause_btn.config(text="⏸  Pause", bg="#FF9800")
            return
            
        if self.engine and self.engine._running:
            return

        seed = self.seed_entry.get().strip()
        gap = self.gap_entry.get().strip()

        if not seed or not gap.isdigit():
            messagebox.showerror("Lỗi", "Seed TIN không hợp lệ hoặc Gap không phải số!")
            return

        gap = int(gap)
        self.start_btn.config(state=tk.DISABLED)
        self.start_edges_btn.config(state=tk.DISABLED)
        self.start_newest_btn.config(state=tk.DISABLED)
        self.start_down_btn.config(state=tk.DISABLED)
        self.pause_btn.config(state=tk.NORMAL)
        self.stop_btn.config(state=tk.NORMAL)
        
        if scan_mode == "newest":
            self.gap_entry.delete(0, tk.END)
            self.gap_entry.insert(0, "60")
            gap = 60
            self._log("Bắt đầu chế độ quét mã số thuế mới nhất (Chỉ tiến lên, Gap=60)...")
        elif scan_mode == "edges":
            self._log(f"Bắt đầu quét mở rộng biên DB hiện tại (Max/Min) (Gap={gap})...")
        elif scan_mode == "down_from_min":
            self._log(f"Bắt đầu quét xuống từ biên Min trong DB (Gap={gap})...")
        else:
            self._log(f"Bắt đầu quét 2 chiều từ {seed} (Gap={gap})...")

        self.seed_entry.config(state=tk.DISABLED)
        self.gap_entry.config(state=tk.DISABLED)
        self.threads_combo.config(state=tk.DISABLED)

        prov_cfg = PROVINCES[self.current_prov]
        try:
            num_workers = int(self.threads_combo.get())
        except ValueError:
            num_workers = 5
        
        # Khởi tạo CrawlerEngine
        self.engine = CrawlerEngine(
            seed_tin=seed,
            gap=gap,
            prefix=prov_cfg["prefix"],
            activation_tin=prov_cfg["activation_tin"],
            num_workers=num_workers,
            scan_mode=scan_mode,
            on_progress=self._on_progress_cb,
            on_found=self._on_found_cb,
            on_log=self._on_log_cb
        )
        self._start_time = datetime.now()
        self.engine.start()

    def _on_pause(self):
        if not self.engine:
            return
        if self.engine._paused:
            self.engine.resume()
            self.pause_btn.config(text="⏸  Pause", bg="#FF9800")
        else:
            self.engine.pause()
            self.pause_btn.config(text="▶  Resume", bg="#4CAF50")

    def _on_stop(self):
        if self.engine:
            self.engine.stop()
        self.start_btn.config(state=tk.NORMAL)
        self.start_edges_btn.config(state=tk.NORMAL)
        self.start_newest_btn.config(state=tk.NORMAL)
        self.start_down_btn.config(state=tk.NORMAL)
        self.pause_btn.config(state=tk.DISABLED)
        self.stop_btn.config(state=tk.DISABLED)
        # Mở khóa các field cấu hình
        self.seed_entry.config(state=tk.NORMAL)
        self.gap_entry.config(state=tk.NORMAL)
        self.threads_combo.config(state="readonly")
        self._log("Crawler bị buộc dừng bởi người dùng.")

    def _on_export(self):
        import csv
        filename = f"dak_lak_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        try:
            with psycopg2.connect("postgresql://zzsu:Zzs%40123@localhost:5433/taxdb") as conn:
                with conn.cursor() as cursor:
                    cursor.execute("SELECT * FROM tax_records ORDER BY tin")
                    rows = cursor.fetchall()
                    headers = [d[0] for d in cursor.description]
            with open(filename, 'w', newline='', encoding='utf-8-sig') as f:
                w = csv.writer(f)
                w.writerow(headers)
                w.writerows(rows)
            messagebox.showinfo("Export OK", f"Da xuat {len(rows)} ban ghi ra:\n{filename}")
        except Exception as e:
            messagebox.showerror("Loi", str(e))

    # ─── Callbacks from Engine (called from worker threads) ──────────────────
    def _on_progress_cb(self, stats: dict):
        """Gọi an toàn từ thread con sang main thread."""
        self.root.after(0, self._update_stats_ui, stats)

    def _on_found_cb(self, tin: str, name: str):
        self.root.after(0, self._add_found_row, tin, name)

    def _on_log_cb(self, msg: str):
        self.root.after(0, self._log, msg)

    # ─── UI Update helpers (must run on main thread) ──────────────────────────
    def gap_entry_val_ref(self):
        """Lấy giá trị gap cho progress bar maximum."""
        try:
            return int(self.gap_entry.get())
        except:
            return 5000

    def _update_stats_ui(self, stats: dict):
        queried  = stats.get("queried", 0)
        found    = stats.get("found", 0)
        last_tin = stats.get("last_tin", "—")
        streak   = stats.get("empty_streak", 0)
        label    = stats.get("label", "")

        self.stat_vars["queried"].set(f"{queried:,}")
        self.stat_vars["found"].set(f"{found:,}")
        self.stat_vars["last_tin"].set(last_tin or "—")
        self.stat_vars["direction"].set(label.strip() if label else "—")
        self.stat_vars["streak"].set(f"{streak:,}")

        if self._start_time:
            elapsed = (datetime.now() - self._start_time).total_seconds() / 60
            rate = queried / elapsed if elapsed > 0 else 0
            self.stat_vars["rate"].set(f"{rate:,.0f}")

        # Progress bar: hiển empty_streak so với gap
        try:
            gap = int(self.gap_entry.get())
        except:
            gap = 5000
        self.progress_var.set(streak)
        self.progress_bar.config(maximum=gap)
        pct = streak / gap * 100 if gap > 0 else 0
        self.progress_label.config(
            text=f"{label.strip() or '...'}: Empty streak {streak:,} / {gap:,} ({pct:.1f}%) — {datetime.now().strftime('%H:%M:%S')}"
        )

    def _add_found_row(self, tin: str, name: str):
        now = datetime.now().strftime("%H:%M:%S")
        # Lấy thêm status từ DB
        try:
            with psycopg2.connect("postgresql://zzsu:Zzs%40123@localhost:5433/taxdb") as conn:
                with conn.cursor() as cursor:
                    cursor.execute("SELECT status_name FROM tax_records WHERE tin=%s", (tin,))
                    row = cursor.fetchone()
                    status = row[0] if row else ""
        except:
            status = ""
        self.found_tree.insert("", 0, values=(tin, name[:30], status, now))
        # Giới hạn 500 dòng để không lag
        children = self.found_tree.get_children()
        if len(children) > 500:
            self.found_tree.delete(children[-1])

    def _log(self, msg: str):
        self.log_box.config(state=tk.NORMAL)
        self.log_box.insert(tk.END, f"[{datetime.now().strftime('%H:%M:%S')}] {msg}\n")
        self.log_box.see(tk.END)
        self.log_box.config(state=tk.DISABLED)

    def _refresh_stats(self):
        """Tải stats từ DB định kỳ kể cả khi không chạy."""
        try:
            # Chỉ nạp từ DB lên UI nếu crawler ĐANG DỪNG.
            # Nếu đang chạy, để on_progress tự lo realtime update nhằm tránh bị chớp giật UI
            if not (self.engine and self.engine._running):
                progress = self.db.get_progress()
                self._update_stats_ui({
                    "queried": progress["total_queried"],
                    "found":   progress["total_found"],
                    "last_tin": progress["last_tin"]
                })
        except:
            pass
        self.root.after(5000, self._refresh_stats)


if __name__ == "__main__":
    root = tk.Tk()
    app = CrawlerGUI(root)
    root.mainloop()
