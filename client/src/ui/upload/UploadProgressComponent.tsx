import { useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { UploadError } from "src/fileQueue";
import { State } from "../../reducers/rootReducer";

const styles = {
  container: {
    backgroundColor: "#eee",
    border: "1px solid #222",
    minWidth: "120px",
  },
  showHideButton: {
    backgroundColor: "transparent",
    border: 0,
  },
};

function UploadProgressComponent() {
  const { uploadQueue } = useSelector(
    (state: State) => state.mediaFilesReducer
  );

  const [showDetails, setShowDetails] = useState(true);

  const status = uploadQueue.getStatus();

  if (
    status.queued.length === 0 &&
    status.currentlyUploading.length === 0 &&
    status.finished.length === 0
  ) {
    return null;
  }

  return (
    <div style={styles.container}>
      <div className="p-3 mb-2 bg-dark text-white d-flex justify-content-between">
        Uploads
        <button
          className="text-white"
          style={styles.showHideButton}
          type="button"
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? (
            <i className="fa fa-angle-up"></i>
          ) : (
            <i className="fa fa-angle-down"></i>
          )}
        </button>
      </div>
      {showDetails && (
        <ul className="list-unstyled p-3 mb-2">
          {status.finished.map((finishedFile, idx) => {
            let text = null;
            const { success } = finishedFile;

            if (success) {
              text = (
                <Link
                  to={`/gallery/detail/${finishedFile.mediaFile.hashValue}`}
                >
                  {finishedFile.mediaFile.getName()}
                </Link>
              );
            }

            if (!success) {
              const { fileName, error } = finishedFile as {
                fileName: string;
                error: UploadError;
              };

              text = `${fileName}: ${error.message}`;
            }

            const icon = success ? (
              <i className="fa fa-check"></i>
            ) : (
              <i className="fa fa-times"></i>
            );
            return (
              <li key={`finished-${idx}`}>
                {icon} {text}
              </li>
            );
          })}

          {status.currentlyUploading.map((file, idx) => (
            <li key={`uploading-${idx}`}>
              <i className="fa fa-clock-o"></i> {file.file.name}
            </li>
          ))}

          {status.queued.map((file, idx) => (
            <li key={`queued-${idx}`}>
              <i className="fa fa-clock-o"></i> {file.file.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default UploadProgressComponent;
