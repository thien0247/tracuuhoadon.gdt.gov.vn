# @id 01M4V0HMQ84SWGPZADDW1P3GNA
# @related 01M4V20J6ZHRVTZGJ1W0QXZFSX, 01M4V0FH0PZ0CY8JH8XJ6K5CNY, 01M4V0FGZN8KJG6YHQM6560EK1
"""
crawler_core.validator
Thuật toán kiểm tra cấu trúc mã số thuế (checksum) và bộ sinh số.
"""

WEIGHTS = [31, 29, 23, 19, 17, 13, 7, 5, 3]


def validate_tin(tin: str) -> bool:
    """
    Port thuật toán ktraCTrucTIN từ JavaScript sang Python.
    Trả về True nếu MST 10 chữ số vượt qua checksum hợp lệ.
    """
    if len(tin) != 10 or not tin.isdigit():
        return False
    digits = [int(c) for c in tin]
    total = sum(digits[i] * WEIGHTS[i] for i in range(9))
    remainder = total % 11
    check_digit = 10 - remainder
    if check_digit >= 10:
        return False
    return check_digit == digits[9]


def generate_direction(seed_tin: str, direction: int, prefix: str):
    """
    Generator sinh MST hợp lệ theo một chiều từ seed_tin tối ưu qua 9 chữ số cơ sở.
    direction = +1 (tăng dần) hoặc -1 (giảm dần).
    Dừng lại khi vượt ra ngoài dải tiền tố prefix.
    """
    lo_base = int(prefix + "0" * (9 - len(prefix)))
    hi_base = int(prefix + "9" * (9 - len(prefix)))
    base = int(seed_tin[:9])
    seed_val = int(seed_tin)

    b_str = f"{base:09d}"
    rem = sum(int(b_str[i]) * WEIGHTS[i] for i in range(9)) % 11
    if rem != 0:
        tin_val = base * 10 + (10 - rem)
        if (direction > 0 and tin_val > seed_val) or (direction < 0 and tin_val < seed_val):
            yield f"{b_str}{10 - rem}"
        # rem == 0 → check digit = 10 → TIN không hợp lệ, bỏ qua

    base += direction
    while lo_base <= base <= hi_base:
        b_str = f"{base:09d}"
        rem = sum(int(b_str[i]) * WEIGHTS[i] for i in range(9)) % 11
        if rem != 0:
            yield f"{b_str}{10 - rem}"
        base += direction


def get_probe_tin(current_tin: str, offset: int, prefix: str) -> str | None:
    """
    Sinh mã số thuế hợp lệ cách current_tin một khoảng offset cơ sở.
    Dùng cho cơ chế Adaptive Dynamic Probe dò tìm dải số nhảy cóc.
    """
    if len(current_tin) < 9 or not current_tin[:9].isdigit():
        return None
    base = int(current_tin[:9]) + offset
    hi_base = int(prefix + "9" * (9 - len(prefix)))
    if base > hi_base:
        return None
    b_str = f"{base:09d}"
    rem = sum(int(b_str[i]) * WEIGHTS[i] for i in range(9)) % 11
    if rem != 0:
        return f"{b_str}{10 - rem}"
    base += 1
    if base <= hi_base:
        b_str = f"{base:09d}"
        rem = sum(int(b_str[i]) * WEIGHTS[i] for i in range(9)) % 11
        if rem != 0:
            return f"{b_str}{10 - rem}"
    return None

