from pydantic import BaseModel, ConfigDict, EmailStr


class UserCreate(BaseModel):

    username: str

    email: EmailStr

    password: str


class UserLogin(BaseModel):

    email: EmailStr

    password: str

class GoogleLogin(BaseModel):
    token: str


class UserResponse(BaseModel):

    id: int

    username: str

    email: EmailStr

    is_active: bool

    model_config = ConfigDict(from_attributes=True)