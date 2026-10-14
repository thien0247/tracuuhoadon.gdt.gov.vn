# @id 01M4V1PY000000000000000001
# @related 01M4V0FGZN8KJG6YHQM6560EK1, 01M4V0FGZT243T45VNH4E9RQCG
"""
server_app.core.ulid
ULID: 01M4V1PY000000000000000001
Bo tien ich sinh ma dinh danh bat bien ULID Crockford Base32 26 ky tu viet hoa.
"""

import time
import secrets
import re

CROCKFORD_BASE32 = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"
ULID_REGEX = re.compile(r"^[0-9A-HJKMNP-TV-Z]{26}$")


def generate_ulid() -> str:
    """
    Sinh ma ULID 26 ky tu viet hoa khang trung lap, sap xep theo mili-giay.
    """
    ms = int(time.time() * 1000)
    time_chars = [""] * 10
    for i in range(9, -1, -1):
        time_chars[i] = CROCKFORD_BASE32[ms & 31]
        ms >>= 5

    rand_bytes = secrets.token_bytes(10)
    bit_buffer = int.from_bytes(rand_bytes, byteorder="big")
    rand_chars = [""] * 16
    for i in range(15, -1, -1):
        rand_chars[i] = CROCKFORD_BASE32[bit_buffer & 31]
        bit_buffer >>= 5

    return "".join(time_chars) + "".join(rand_chars)


def is_valid_ulid(val: str) -> bool:
    """
    Kiem tra chuoi ma co dung dinh dang ULID 26 ky tu Crockford Base32 hay khong.
    """
    if not isinstance(val, str) or len(val) != 26:
        return False
    return bool(ULID_REGEX.match(val))
