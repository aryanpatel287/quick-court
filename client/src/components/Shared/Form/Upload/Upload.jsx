import ButtonUpload from './ButtonUpload/ButtonUpload';
import AvatarUpload from './AvatarUpload/AvatarUpload';

export default function Upload({ variant = 'button', ...props }) {
    switch (variant) {
        case 'button':
            return <ButtonUpload {...props} />;
        case 'avatar':
            return <AvatarUpload {...props} />;
        default:
            return <ButtonUpload {...props} />;
    }
}

export { default as ButtonUpload } from './ButtonUpload/ButtonUpload';
export { default as AvatarUpload } from './AvatarUpload/AvatarUpload';
export { default as useUpload } from './hooks/useUpload';
export { default as FileList } from './FileList/FileList';
export { default as FileCard } from './FileCard/FileCard';
