# ==========================================================
# STAGE 1: Build & Install dependencies
# ==========================================================
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Cài đặt các thư viện hệ thống cần thiết để biên dịch các package native (như bcrypt)
RUN apk add --no-cache python3 make g++

# Chỉ copy package definition trước để tối ưu hóa Docker cache layer
COPY package*.json ./

# Cài đặt các dependencies cần thiết cho runtime (bỏ qua devDependencies)
RUN npm ci --omit=dev

# ==========================================================
# STAGE 2: Production runtime environment
# ==========================================================
FROM node:20-alpine AS runner

WORKDIR /usr/src/app

# Thiết lập biến môi trường production
ENV NODE_ENV=production
ENV PORT=8001

# Copy dependencies từ stage builder
COPY --from=builder /usr/src/app/node_modules ./node_modules

# Copy mã nguồn của ứng dụng
COPY package.json ./
COPY server.js ./
COPY src ./src

# Sử dụng tài khoản non-root 'node' có sẵn trong image để chạy ứng dụng (tăng bảo mật)
USER node

# Expose cổng mà server Express lắng nghe (mặc định là 8001)
EXPOSE 8001

# Khởi chạy ứng dụng
CMD ["node", "server.js"]
