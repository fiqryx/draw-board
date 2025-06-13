'use client'
import { atom, useAtom } from 'jotai';
import { useState, useEffect } from 'react';

const BASE_KEY = 'preferences';

const storage = {
    getItem: <T,>(key: string, defaultValue: T): T => {
        if (typeof window === 'undefined') return defaultValue;
        try {
            const baseItem = localStorage.getItem(BASE_KEY);
            if (!baseItem) return defaultValue;

            const baseObject = JSON.parse(baseItem);
            return baseObject?.[key] !== undefined ? baseObject[key] : defaultValue;
        } catch (error) {
            console.error('LocalStorage read error:', error);
            return defaultValue;
        }
    },

    setItem: <T,>(key: string, value: T): void => {
        if (typeof window === 'undefined') return;
        try {
            const baseItem = localStorage.getItem(BASE_KEY);
            const baseObject = baseItem ? JSON.parse(baseItem) : {};
            baseObject[key] = value;
            localStorage.setItem(BASE_KEY, JSON.stringify(baseObject));
        } catch (error) {
            console.error('LocalStorage write error:', error);
        }
    },

    removeItem: (key: string): void => {
        if (typeof window === 'undefined') return;
        try {
            const baseItem = localStorage.getItem(BASE_KEY);
            if (!baseItem) return;

            const baseObject = JSON.parse(baseItem);
            delete baseObject[key];
            localStorage.setItem(BASE_KEY, JSON.stringify(baseObject));
        } catch (error) {
            console.error('LocalStorage remove error:', error);
        }
    }
};

export function usePersistedState<T>(
    key: string,
    defaultValue: T
): [T, React.Dispatch<React.SetStateAction<T>>] {
    const [state, setState] = useState<T>(() =>
        storage.getItem(key, defaultValue)
    );

    useEffect(() => {
        storage.setItem(key, state);
    }, [key, state]);

    return [state, setState];
}

export function createPersistedAtom<T>(key: string, defaultValue: T) {
    const baseAtom = atom<T>(storage.getItem(key, defaultValue))

    const persistedAtom = atom(
        (get) => get(baseAtom),
        (get, set, update: React.SetStateAction<T>) => {
            const prev = get(baseAtom)
            const next = typeof update === 'function' ? (update as (prev: T) => T)(prev) : update

            if (!Object.is(prev, next)) {
                set(baseAtom, next)
                storage.setItem(key, next)
            }
        }
    )

    return persistedAtom
}

export function usePersistedAtom<T>(
    atom: ReturnType<typeof createPersistedAtom<T>>
): [T, React.Dispatch<React.SetStateAction<T>>] {
    return useAtom(atom)
}