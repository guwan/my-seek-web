import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {UserInfo} from "~/services/data";

interface CurrentUserState {
    value: UserInfo;
}

const initialState: CurrentUserState = {
    value: {},
};

export const currentUserSlice = createSlice({
    name: 'currentUser',
    initialState,
    reducers: {
        setCurrentUser: (state, action: PayloadAction<UserInfo>) => {
            state.value = action.payload;
        },
    },
});

export const {  setCurrentUser } = currentUserSlice.actions;
export default currentUserSlice.reducer;
