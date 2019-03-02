import * as React from 'react';

enum UploadStatus {
    Queued,
    InProgress,
    Done,
}

type FileUpload = {
    filename: string;
    progress: UploadStatus;    
};

type Props = {
    files: FileUpload[]
};

export class UploadProgressComponent extends React.Component<Props> {
    render() {
        const filesJSX = this.props.files.map((file, i) => {
            return (
                <li key={i}>
                    {file.filename}: {file.progress}
                </li>
            );
        });

        return <ul>{filesJSX}</ul>;
    }
}
