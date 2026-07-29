def test_token_sid_roundtrip():
    from app.security import create_access_token, decode_access_token
    t = create_access_token(7, 0, sid=42)
    d = decode_access_token(t)
    assert d["user_id"] == 7 and d["ver"] == 0 and d["sid"] == 42
    t2 = create_access_token(7, 0)
    assert decode_access_token(t2)["sid"] is None
