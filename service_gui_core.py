"""
service_gui_core.py - Core Controller logic for GDTTaxCrawler Windows Service.
Handles service lifecycle, port checks, and asynchronous command execution.
"""
import os
import socket
import subprocess
import threading
from typing import Callable, Tuple, Optional

SERVICE_NAME = "GDTTaxCrawler"
SERVICE_DISPLAY = "GDT Tax Crawler - Search Engine Service"
SERVICE_DESC = "Dich vu tu dong vet can ma so thue va API tra cuu du lieu thue GDT (Port 8123 & 8124)"
APP_DIR = os.path.dirname(os.path.abspath(__file__))


def get_nssm_path() -> str:
    """Locate nssm.exe inside bin/ or from system PATH."""
    local_nssm = os.path.join(APP_DIR, "bin", "nssm.exe")
    if os.path.exists(local_nssm):
        return local_nssm
    return "nssm"


def check_port_listening(port: int, host: str = "127.0.0.1") -> bool:
    """Check if a specific TCP port is open and listening."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.6)
        return s.connect_ex((host, port)) == 0


def get_service_status() -> str:
    """Query current Windows Service status. Returns: RUNNING, STOPPED, or NOT_INSTALLED."""
    cmd = f'powershell -NoProfile -Command "(Get-Service {SERVICE_NAME} -ErrorAction SilentlyContinue).Status"'
    try:
        res = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        raw = res.stdout.strip().lower()
        if "running" in raw:
            return "RUNNING"
        elif "stopped" in raw:
            return "STOPPED"
        return "NOT_INSTALLED"
    except Exception:
        return "NOT_INSTALLED"


def run_async_command(cmd: str, on_output: Callable[[str, str], None], on_finished: Optional[Callable[[], None]] = None):
    """Execute shell command in background thread and stream output lines."""
    def worker():
        try:
            p = subprocess.Popen(cmd, shell=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, cwd=APP_DIR)
            for line in iter(p.stdout.readline, ''):
                if line:
                    lvl = "ERROR" if any(w in line.lower() for w in ["lỗi", "error", "failed"]) else "INFO"
                    on_output(line.rstrip(), lvl)
            p.wait()
            on_output(f"[Hoàn tất] Mã trả về: {p.returncode}", "SUCCESS" if p.returncode == 0 else "ERROR")
        except Exception as e:
            on_output(f"[Lỗi thực thi]: {str(e)}", "ERROR")
        finally:
            if on_finished:
                on_finished()

    threading.Thread(target=worker, daemon=True).start()


class ServiceManager:
    """High-level API executing service tasks matching service.bat."""

    def __init__(self, log_cb: Callable[[str, str], None], refresh_cb: Callable[[], None]):
        self.log = log_cb
        self.refresh = refresh_cb
        self.nssm = get_nssm_path()

    def install(self):
        runner = os.path.join(APP_DIR, "service_runner.bat")
        logs_dir = os.path.join(APP_DIR, "logs")
        os.makedirs(logs_dir, exist_ok=True)
        self.log(f"Đang đăng ký dịch vụ {SERVICE_NAME}...", "INFO")
        cmd = (
            f'"{self.nssm}" install "{SERVICE_NAME}" "cmd.exe" "/c \\"{runner}\\"" && '
            f'"{self.nssm}" set "{SERVICE_NAME}" AppDirectory "{APP_DIR}" && '
            f'"{self.nssm}" set "{SERVICE_NAME}" DisplayName "{SERVICE_DISPLAY}" && '
            f'"{self.nssm}" set "{SERVICE_NAME}" Description "{SERVICE_DESC}" && '
            f'"{self.nssm}" set "{SERVICE_NAME}" Start SERVICE_AUTO_START && '
            f'"{self.nssm}" set "{SERVICE_NAME}" AppStdout "{logs_dir}\\service_out.log" && '
            f'"{self.nssm}" set "{SERVICE_NAME}" AppStderr "{logs_dir}\\service_err.log" && '
            f'"{self.nssm}" set "{SERVICE_NAME}" AppRotateFiles 1 && '
            f'"{self.nssm}" set "{SERVICE_NAME}" AppRotateBytes 10485760'
        )
        run_async_command(cmd, self.log, self.refresh)

    def uninstall(self):
        self.log(f"Đang gỡ bỏ dịch vụ {SERVICE_NAME}...", "WARNING")
        cmd = (
            f'"{self.nssm}" stop "{SERVICE_NAME}" >nul 2>&1 & '
            f'powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 8123,8124 -ErrorAction SilentlyContinue | ForEach-Object {{ Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }}" & '
            f'"{self.nssm}" remove "{SERVICE_NAME}" confirm'
        )
        run_async_command(cmd, self.log, self.refresh)

    def start(self):
        self.log(f"Đang khởi động dịch vụ {SERVICE_NAME}...", "INFO")
        cmd = f'"{self.nssm}" start "{SERVICE_NAME}"'
        run_async_command(cmd, self.log, self.refresh)

    def stop(self):
        self.log(f"Đang dừng dịch vụ {SERVICE_NAME} & giải phóng cổng...", "WARNING")
        cmd = (
            f'"{self.nssm}" stop "{SERVICE_NAME}" & '
            f'powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 8123,8124 -ErrorAction SilentlyContinue | ForEach-Object {{ Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }}"'
        )
        run_async_command(cmd, self.log, self.refresh)

    def restart(self):
        self.log(f"Đang Reset / Khởi động lại dịch vụ {SERVICE_NAME}...", "INFO")
        cmd = (
            f'"{self.nssm}" stop "{SERVICE_NAME}" >nul 2>&1 & '
            f'powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 8123,8124 -ErrorAction SilentlyContinue | ForEach-Object {{ Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }}" & '
            f'ping 127.0.0.1 -n 3 >nul & "{self.nssm}" start "{SERVICE_NAME}"'
        )
        run_async_command(cmd, self.log, self.refresh)
