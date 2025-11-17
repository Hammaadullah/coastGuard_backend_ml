import type { User } from "../type.ts";
import { query, queryOne } from "../db.js";

export async function createUser(
    userName: string,
    email: string,
    hashedPassword: string,
    phone: string
): Promise<User> {
    const sql = `
    INSERT INTO users (user_name, email, hashed_password, phone, user_role_id)
    VALUES ($1, $2, $3, $4, 1)
    RETURNING user_id, user_name, email, phone, created_at
  `;
    const user = await queryOne<User>(sql, [userName, email, hashedPassword, phone]);

    return user!;
}

export async function findUserByEmail(email: string): Promise<User | null> {
    const sql = `SELECT * FROM users WHERE email = $1 AND is_deleted = false`;
    return await queryOne<User>(sql, [email]);
}

export async function findUserByUserName(userName: string): Promise<User | null> {
    const sql = `SELECT * FROM users WHERE user_name = $1 AND is_deleted = false`;
    return await queryOne<User>(sql, [userName]);
}

export async function findUserById(userId: string): Promise<User | null> {
    const sql = `SELECT * FROM users WHERE user_id = $1 AND is_deleted = false`;
    return await queryOne<User>(sql, [userId]);
}

