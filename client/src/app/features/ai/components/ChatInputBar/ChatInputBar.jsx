import { useRef, useCallback, useLayoutEffect } from 'react';
import { Plus } from 'lucide-react';
import { SpeechInput } from '@/components/ai-elements/speech-input/speech-input';
import {
    Attachments,
    Attachment,
    AttachmentPreview,
    AttachmentInfo,
    AttachmentRemove,
} from '@/components/ai-elements/attachments/attachments';
import { useUpload } from '../../hooks/useUpload';
import './ChatInputBar.scss';

/**
 * ChatInputBar
 *
 * Owns its own local state:
 *  - fileInputRef   — hidden file input ref
 * Auto-grow textarea height is handled inline in onChange.
 *
 * Props:
 *  - inputText      string
 *  - onInputChange  (text: string) => void
 *  - onSend         (text: string) => void
 *  - isStreaming     boolean
 */
export default function ChatInputBar({ inputText, onInputChange, onSend, isStreaming }) {
    const { attachedFiles, uploadFiles, removeFile, isUploading } = useUpload();
    const fileInputRef = useRef(null);
    const textareaRef = useRef(null);

    // ---- File handling ----

    const handleFileChange = useCallback(
        (e) => {
            if (!e.target.files) return;
            uploadFiles(e.target.files);
            e.target.value = '';
        },
        [uploadFiles],
    );

    const handleRemoveFile = useCallback(
        (id) => {
            removeFile(id);
        },
        [removeFile],
    );

    // ---- Send ----

    const handleSend = useCallback(() => {
        onSend(inputText);
    }, [onSend, inputText]);

    // ---- Textarea auto-grow ----

    useLayoutEffect(() => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        textarea.style.height = 'auto';
        if (inputText) {
            textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
        }
    }, [inputText]);

    const handleTextareaChange = useCallback(
        (e) => {
            onInputChange(e.target.value);
        },
        [onInputChange],
    );

    const handleKeyDown = useCallback(
        (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
            }
        },
        [handleSend],
    );

    const canSend =
        (inputText.trim().length > 0 || attachedFiles.length > 0) && !isStreaming && !isUploading;

    return (
        <div className="chat-input-bar">
            {/* Hidden file picker */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                multiple
                className="chat-input-bar__file-input"
                onChange={handleFileChange}
            />

            <div className="chat-input-bar__shell">
                {/* Attachment previews — shown above the text row */}
                {attachedFiles.length > 0 && (
                    <div className="chat-input-bar__attachment-strip">
                        <Attachments variant="inline">
                            {attachedFiles.map((f) => (
                                <Attachment
                                    key={f.id}
                                    data={f}
                                    onRemove={() => handleRemoveFile(f.id)}
                                >
                                    <AttachmentPreview />
                                    <AttachmentInfo />
                                    <AttachmentRemove />
                                </Attachment>
                            ))}
                        </Attachments>
                    </div>
                )}

                {/* Main row: [+] [textarea] [mic] [send] */}
                <div className="chat-input-bar__row">
                    {/* Plus / add-file button */}
                    <button
                        type="button"
                        className="chat-input-bar__icon-btn chat-input-bar__plus-btn"
                        title="Add file"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <Plus size={18} />
                    </button>

                    {/* Growing textarea */}
                    <textarea
                        ref={textareaRef}
                        className="chat-input-bar__textarea"
                        placeholder="Message AI…"
                        value={inputText}
                        rows={1}
                        onChange={handleTextareaChange}
                        onKeyDown={handleKeyDown}
                    />

                    {/* Right actions: mic + send */}
                    <div className="chat-input-bar__actions">
                        <SpeechInput
                            onTranscriptionChange={(t) => onInputChange((prev) => prev + ' ' + t)}
                        />

                        <button
                            type="button"
                            className="chat-input-bar__icon-btn chat-input-bar__send-btn"
                            title="Send"
                            disabled={!canSend}
                            onClick={handleSend}
                        >
                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <line x1="12" y1="19" x2="12" y2="5" />
                                <polyline points="5 12 12 5 19 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
