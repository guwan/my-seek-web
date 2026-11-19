import {httpClient} from "~/lib/request";
import type {Result} from "~/services/data";

export interface UserAccount {
    id?: number;
    name?: string;
    username?: string;
    userid?: string;
    email?: string;
    phone?: string;
    access?: string;
    enabled?: boolean;
    avatar?: string;
    title?: string;
    group?: string;
}

export interface UserPage {
    current?: number;
    pageSize?: number;
    total?: number;
    data?: UserAccount[];
}

export interface RoleOption {
    key?: number;
    id?: number;
    title?: string;
    authority?: string;
}

export interface UserQueryParams {
    current: number;
    pageSize: number;
    name?: string;
    username?: string;
    phone?: string;
    email?: string;
    enabled?: boolean;
}

export interface UserFormPayload {
    id?: number;
    name?: string;
    username?: string;
    phone?: string;
    dialPhone?: string;
    email?: string;
    level?: number;
    enabled?: boolean;
    password?: string;
    access?: string;
}

export const queryUsers = (params: UserQueryParams) =>
    httpClient.post<UserPage>('/api/user/query', params as Record<string, any>);

export const createUser = (payload: UserFormPayload) =>
    httpClient.post<Result<unknown>>('/api/user/add', payload as Record<string, any>);

export const updateUser = (payload: UserFormPayload) =>
    httpClient.post<Result<unknown>>('/api/user/update', payload as Record<string, any>);

export const deleteUsers = (ids: number[]) =>
    httpClient.post<Result<unknown>>('/api/user/delete', {ids});

export const queryAllRoles = () =>
    httpClient.post<Result<{treeData?: RoleOption[]}>>('/api/user/queryAllRole');

export const queryUserRoles = (id: number) =>
    httpClient.post<Result<{checkedKeys?: number[]}>>(`/api/user/queryUserRole?id=${id}`);

export const updateUserRoles = (id: number, checkedKeys: number[]) =>
    httpClient.post<Result<unknown>>('/api/user/updateUserRole', {id, checkedKeys});
