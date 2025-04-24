const user_token_key = 'proman_user_token';
export const getUserToken = () => {
  return localStorage.getItem(user_token_key);
};

export const saveUserToken = (token: string) => {
  localStorage.setItem(user_token_key, token);
};
export const deleteUserToken = () => {
  localStorage.removeItem(user_token_key);
};
