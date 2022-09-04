import * as React from "react";
import { ChangeEvent } from "react";
import { useMutation } from "react-query";
import { useDispatch, useSelector } from "react-redux";
import { uploadFile } from "src/actions/mediaFileActions";
import { State } from "src/reducers/rootReducer";

import { MediaFile } from "../../domain/MediaFile";
import { themeStyles } from "../../theme/theme";

const styles = {
  uploadInput: {
    display: "none",
  },
};

function useUploadFilesMutation() {
  const dispatch = useDispatch();
  const state = useSelector((state: State) => state);

  return useMutation(async (files: FileList) => {
    const promises = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      promises.push(uploadFile(file)(dispatch, () => state));
    }

    await Promise.all(promises);
  });
}

function UploadComponent() {
  const uploadFilesMutation = useUploadFilesMutation();

  const onFileUploadSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const { files } = event.target;

    if (!files) {
      return;
    }

    uploadFilesMutation.mutate(files);
  };

  return (
    <label className="btn btn-secondary" style={themeStyles.button}>
      Upload
      <input
        style={styles.uploadInput}
        type="file"
        multiple={true}
        onChange={onFileUploadSelected}
      />
    </label>
  );
}

export default UploadComponent;
