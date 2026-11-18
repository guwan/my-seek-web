import {combineReducers} from '@reduxjs/toolkit';
import currentUserReducer from './currentUserSlice';
import chatHistoryReducer from "./chatHistorySlice";
import modelReducer from './modelSlice';
import writingReducer from './writingSlice';

const rootReducer = combineReducers({
    currentUserSetter: currentUserReducer,
    chatHistorySetter: chatHistoryReducer,
    models: modelReducer,
    writing: writingReducer
});

export default rootReducer;
