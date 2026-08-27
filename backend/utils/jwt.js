import jwt from "jsonwebtoken"

export const generateToken = (user, expiresIn, JWT_SECRET) => {
    return jwt.sign({
        id: user._id,
        name: user.name,
        email: user.email
    }, JWT_SECRET, {
        expiresIn
    })
}

export const verifyToken = (token, JWT_SECRET) => {
    return jwt.verify(token, JWT_SECRET)
}

export const setCookie = (res, token, expiresIn, tokenName) => {
    res.cookie(tokenName, token, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: expiresIn,
    });
};
