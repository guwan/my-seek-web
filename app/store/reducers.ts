import {combineReducers} from '@reduxjs/toolkit';
import currentUserReducer from './currentUserSlice';
import chatHistoryReducer from "./chatHistorySlice";
import modelReducer from './modelSlice';

const rootReducer = combineReducers({
    currentUserSetter: currentUserReducer,
    chatHistorySetter: chatHistoryReducer,
    models: modelReducer
});

export default rootReducer;
