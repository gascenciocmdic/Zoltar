import { createContext, useContext } from 'react';

export const UATContext = createContext({ isUAT: false });
export const useUAT = () => useContext(UATContext);
