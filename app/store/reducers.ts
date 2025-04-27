import {combineReducers} from '@reduxjs/toolkit';
import currentUserReducer from './currentUserSlice';
import {chatHistorySlice} from "./chatHistorySlice";

const rootReducer = combineReducers({
    currentUserSetter: currentUserReducer,
    chatHistorySetter: chatHistoryReducer
});

export default rootReducer;
