def test_discord_registration_token_roundtrip():
    from app.security import (
        create_discord_registration_token,
        decode_discord_registration_token,
        decode_registration_token,
    )
    t = create_discord_registration_token("42", "d@t.io", "neo")
    assert decode_discord_registration_token(t) == {"discord_id": "42", "email": "d@t.io", "username": "neo"}
    assert decode_registration_token(t) is None  # google-декодер не принимает discord-токен
