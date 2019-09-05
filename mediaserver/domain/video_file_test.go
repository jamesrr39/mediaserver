package domain

import (
	"reflect"
	"testing"
)

func TestVideoFileMetadata_Clone(t *testing.T) {
	type fields struct {
		MediaFileInfo MediaFileInfo
	}
	tests := []struct {
		name   string
		fields fields
		want   MediaFile
	}{{
		"",
		fields{
			MediaFileInfo{
				RelativePath: "a/b/c.ogv",
			},
		},
		&VideoFileMetadata{
			MediaFileInfo{
				RelativePath: "a/b/c.ogv",
			},
		},
	}}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			pm := &VideoFileMetadata{
				MediaFileInfo: tt.fields.MediaFileInfo,
			}
			if got := pm.Clone(); !reflect.DeepEqual(got, tt.want) {
				t.Errorf("VideoFileMetadata.Clone() = %v, want %v", got, tt.want)
			}
		})
	}
}
