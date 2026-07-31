"""Pydantic-схемы: что приходит в запросах и что уходит в ответах."""
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field

USERNAME_PATTERN = r"^[A-Za-z0-9_]{3,20}$"


class RegisterIn(BaseModel):
    username: str = Field(pattern=USERNAME_PATTERN)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class UsernameIn(BaseModel):
    username: str = Field(pattern=USERNAME_PATTERN)


class ChangePasswordIn(BaseModel):
    current_password: str | None = None
    new_password: str = Field(min_length=6, max_length=128)


class UserOut(BaseModel):
    id: int
    username: str
    email: EmailStr | None = None
    email_verified: bool
    avatar_url: str | None = None
    created_at: datetime
    providers: list[str] = []
    has_avatar: bool = False
    avatar_v: int | None = None

    model_config = {"from_attributes": True}


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class GoogleIn(BaseModel):
    id_token: str


class GoogleCompleteIn(BaseModel):
    registration_token: str
    username: str = Field(pattern=USERNAME_PATTERN)


class GoogleAuthOut(BaseModel):
    access_token: str | None = None
    token_type: str | None = None
    user: UserOut | None = None
    needs_username: bool = False
    registration_token: str | None = None
