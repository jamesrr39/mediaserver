package videodal

import (
	"errors"
	"fmt"
	"log"
	"mediaserverapp/mediaserver/domain"
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	"github.com/jamesrr39/goutil/gofs"
	"github.com/jamesrr39/semaphore"

	"github.com/jamesrr39/goutil/errorsx"
)

var (
	ErrWrongFileType = errors.New("wrong file type")
)

type FFMPEGDAL struct {
	fs               gofs.Fs
	videosBasePath   string
	picturesBasePath string
	sema             *semaphore.Semaphore
}

func NewFFMPEGDAL(fs gofs.Fs, videosBathPath, picturesBasePath string, maxConcurrentVideoConversions uint) (*FFMPEGDAL, error) {
	err := fs.MkdirAll(videosBathPath, 0700)
	if err != nil {
		return nil, errorsx.Wrap(err)
	}
	return &FFMPEGDAL{fs, videosBathPath, picturesBasePath, semaphore.NewSemaphore(maxConcurrentVideoConversions)}, nil
}

func (dal *FFMPEGDAL) GetFile(hash domain.HashValue) (gofs.File, error) {
	return dal.fs.Open(dal.buildPath(hash))
}

func (dal *FFMPEGDAL) EnsureSupportedFile(mediaFile domain.MediaFile) error {
	if mediaFile.GetMediaFileInfo().MediaFileType != domain.MediaFileTypeVideo {
		return ErrWrongFileType
	}

	if !strings.HasSuffix(mediaFile.GetMediaFileInfo().RelativePath, ".ogv") {
		toPath := filepath.Join(dal.videosBasePath, fmt.Sprintf("%s.ogv", mediaFile.GetMediaFileInfo().HashValue))
		_, err := dal.fs.Stat(toPath)
		if err != nil {
			if !os.IsNotExist(err) {
				return errorsx.Wrap(err)
			}
			dal.sema.Add()
			defer dal.sema.Done()
			return dal.convertToOgv(filepath.Join(dal.picturesBasePath, mediaFile.GetMediaFileInfo().RelativePath), toPath)
		}
	}
	return nil
}

func (dal *FFMPEGDAL) buildPath(hash domain.HashValue) string {
	return filepath.Join(dal.videosBasePath, string(hash)+".ogv")
}

func (dal *FFMPEGDAL) convertToOgv(fromPath, toPath string) error {
	log.Printf("converting from %q to %q\n", fromPath, toPath)
	cmd := exec.Command(
		"ffmpeg",
		"-i", fromPath,
		"-c:v", "libtheora",
		"-q:v", "7",
		"-c:a", "libvorbis",
		"-q:a", "4",
		toPath,
	)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	return cmd.Run()
}

// func (dal *FFMPEGDAL) getMetadata(filePath string) error {
/*
	mediainfo --OUTPUT=XML FHD0035.MOV

		<?xml version="1.0" encoding="UTF-8"?>
	<Mediainfo
	    version="0.1"
	    ref="FHD0035.MOV">
	<File>
	<track type="General">
	<Complete_name>FHD0035.MOV</Complete_name>
	<Format>MPEG-4</Format>
	<Format_profile>QuickTime</Format_profile>
	<Codec_ID>qt   0000.00 (qt  )</Codec_ID>
	<File_size>20.8 MiB</File_size>
	<Duration>12s 500ms</Duration>
	<Overall_bit_rate>14.0 Mbps</Overall_bit_rate>
	<Encoded_date>UTC 2018-01-02 11:42:40</Encoded_date>
	<Tagged_date>UTC 2018-01-02 11:42:40</Tagged_date>
	<Writing_library>icat</Writing_library>
	</track>

	<track type="Video">
	<ID>1</ID>
	<Format>AVC</Format>
	<Format_Info>Advanced Video Codec</Format_Info>
	<Format_profile>High@L4</Format_profile>
	<Format_settings__CABAC>Yes</Format_settings__CABAC>
	<Format_settings__ReFrames>2 frames</Format_settings__ReFrames>
	<Format_settings__GOP>M=3, N=15</Format_settings__GOP>
	<Codec_ID>avc1</Codec_ID>
	<Codec_ID_Info>Advanced Video Coding</Codec_ID_Info>
	<Duration>12s 500ms</Duration>
	<Bit_rate>13.2 Mbps</Bit_rate>
	<Width>1 920 pixels</Width>
	<Height>1 080 pixels</Height>
	<Display_aspect_ratio>16:9</Display_aspect_ratio>
	<Frame_rate_mode>Constant</Frame_rate_mode>
	<Frame_rate>30.000 fps</Frame_rate>
	<Color_space>YUV</Color_space>
	<Chroma_subsampling>4:2:0</Chroma_subsampling>
	<Bit_depth>8 bits</Bit_depth>
	<Scan_type>Progressive</Scan_type>
	<Bits__Pixel_Frame_>0.212</Bits__Pixel_Frame_>
	<Stream_size>19.7 MiB (94%)</Stream_size>
	<Language>English</Language>
	<Encoded_date>UTC 2018-01-02 11:42:40</Encoded_date>
	<Tagged_date>UTC 2018-01-02 11:42:40</Tagged_date>
	<Color_range>Full</Color_range>
	<Color_primaries>BT.709</Color_primaries>
	<Transfer_characteristics>BT.709</Transfer_characteristics>
	<Matrix_coefficients>BT.709</Matrix_coefficients>
	</track>

	<track type="Audio">
	<ID>2</ID>
	<Format>PCM</Format>
	<Format_settings__Endianness>Little</Format_settings__Endianness>
	<Format_settings__Sign>Signed</Format_settings__Sign>
	<Codec_ID>sowt</Codec_ID>
	<Duration>12s 500ms</Duration>
	<Bit_rate_mode>Constant</Bit_rate_mode>
	<Bit_rate>768 Kbps</Bit_rate>
	<Channel_s_>1 channel</Channel_s_>
	<Sampling_rate>48.0 KHz</Sampling_rate>
	<Bit_depth>16 bits</Bit_depth>
	<Stream_size>1.14 MiB (5%)</Stream_size>
	<Language>English</Language>
	<Encoded_date>UTC 2018-01-02 11:42:40</Encoded_date>
	<Tagged_date>UTC 2018-01-02 11:42:40</Tagged_date>
	</track>

	</File>
	</Mediainfo>
*/
// }
