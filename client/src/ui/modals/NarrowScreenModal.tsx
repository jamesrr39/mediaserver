export default function NarrowScreenModal() {
  throw new Error("not implemented");
}

/*


  private renderNarrowScreenModalBody = (mediaFile: MediaFile) => {
    if (this.state.showInfo) {
      return (
        <div style={styles.narrowScreenPictureInfoContainer}>
          <FileInfoComponent mediaFile={mediaFile} />
        </div>
      );
    }
    return this.renderMediaFile(mediaFile, true);
  };

  private renderMediaFile = (mediaFile: MediaFile, narrowScreen: boolean) => {
    const previousLink = 
    const nextLink = this.renderNextLink();

    return (
      <>
        {previousLink}
        {this.renderMediaFileContent(mediaFile)}
        {nextLink}
      </>
    );
  };

  private renderMediaFileContent = (mediaFile: MediaFile) => {
    const { showInfo } = this.state;

    switch (mediaFile.fileType) {
      case MediaFileType.Picture: {
        return <PictureModal pictureMetadata={mediaFile} showInfo={showInfo} />;
      }
      case MediaFileType.Video:
        return <VideoModal {...{ mediaFile }} />;
      case MediaFileType.FitTrack: {
        const props = {
          trackSummary: mediaFile,
          ts: Date.now(),
        };
        return <TrackModalContent {...props} />;
      }
      default:
        return <p>Unknown format</p>;
    }
  };



  private renderNextLink = () => {
    const style = {
      ...navButtonTextStyle,
      right: "0px",
    };

    return this.nextPictureMetadata ? (
      <Link
        to={`${this.props.baseUrl}/detail/${this.nextPictureMetadata.hashValue}`}
        style={style}
        aria-label="next"
      >
        &rarr;
      </Link>
    ) : null;
  };

  private goBack = () => {
    window.location.hash = `#${this.props.baseUrl}`;
  };

  private goToPrevious = () => {
    if (this.previousPictureMetadata !== null) {
      window.location.hash = `#${this.props.baseUrl}/detail/${this.previousPictureMetadata.hashValue}`;
    }
  };

  private goToNext = () => {
    if (this.nextPictureMetadata !== null) {
      window.location.hash = `#${this.props.baseUrl}/detail/${this.nextPictureMetadata.hashValue}`;
    }
  };

  */
