import {combineReducers} from '@reduxjs/toolkit';
import currentUserReducer from './currentUserSlice';
import chatHistoryReducer from "./chatHistorySlice";

const rootReducer = combineReducers({
    currentUserSetter: currentUserReducer,
    chatHistorySetter: chatHistoryReducer
});

export default rootReducer;
