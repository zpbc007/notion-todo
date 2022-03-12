import { useStorageLocal } from '~/hooks/useStorageLocal';

export const storageDemo = useStorageLocal('webext-demo', 'Storage Demo', {
    listenToStorageChanges: true,
});
