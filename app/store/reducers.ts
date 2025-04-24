import {combineReducers} from '@reduxjs/toolkit';
import currentUserReducer from './currentUserSlice';

const rootReducer = combineReducers({
    currentUserSetter: currentUserReducer,
});

export default rootReducer;
