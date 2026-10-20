import jwt from "jsonwebtoken"

export const generateToken = (user, expiresIn, JWT_SECRET) => {
    return jwt.sign({
        id: user._id,
        name: user.name,
        email: user.email,
        version: user.sessionVersion || 0,
        kind: JWT_SECRET === process.env.JWT_REFRESH_SECRET ? "refresh" : "access"
    }, JWT_SECRET, {
        expiresIn
    })
}

export const verifyToken = (token, JWT_SECRET) => {
    const payload = jwt.verify(token, JWT_SECRET, { algorithms: ["HS256"] });
    const kind = JWT_SECRET === process.env.JWT_REFRESH_SECRET ? "refresh" : "access";
    if (payload.kind !== kind || !Number.isInteger(payload.version)) throw new Error("Invalid session token");
    return payload;
}

export const setCookie = (res, token, expiresIn, tokenName) => {
    res.cookie(tokenName, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        path: "/",
        maxAge: expiresIn,
    });
};
