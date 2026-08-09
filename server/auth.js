import jwt from 'jsonwebtoken'

// 生产环境建议通过环境变量 JWT_SECRET 设置密钥
const JWT_SECRET = process.env.JWT_SECRET || 'lzh-wine-dev-secret-change-me'

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

// 需要登录的接口中间件
export function authRequired(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (!token) {
    return res.status(401).json({ message: '未登录，请先登录' })
  }
  try {
    req.user = jwt.verify(token, JWT_SECRET)
    next()
  } catch {
    return res.status(401).json({ message: '登录状态已失效，请重新登录' })
  }
}
