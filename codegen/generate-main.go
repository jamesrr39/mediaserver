package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"strconv"
	"strings"

	"github.com/jamesrr39/goutil/must"
)

func main() {
	err := writeGeneratedCode(generateThumbnailSizesCode())
	must.Must(err)
}

type ThumbnailSizes struct {
	Heights []int `json:"heights"`
}

func generateThumbnailSizesCode() GeneratedCode {
	schemaFilePath := "codegen/data/thumbnail_sizes.json"

	thumbnailSizesFileBytes, err := ioutil.ReadFile(schemaFilePath)
	must.Must(err)

	var thumbnailSizes ThumbnailSizes
	must.Must(json.Unmarshal(thumbnailSizesFileBytes, &thumbnailSizes))

	var heightsAsStrings []string
	for _, height := range thumbnailSizes.Heights {
		heightsAsStrings = append(heightsAsStrings, strconv.Itoa(height))
	}

	commaSeparatedHeightsList := strings.Join(heightsAsStrings, ", ")

	goCode := fmt.Sprintf(`package generated

var ThumbnailHeights = []uint{%s}
`, commaSeparatedHeightsList)

	typescriptCode := fmt.Sprintf(`export const THUMBNAIL_HEIGHTS = [%s];
`, commaSeparatedHeightsList)

	return GeneratedCode{
		TypescriptCode: typescriptCode,
		GoCode:         goCode,
		RelativePath:   "thumbnail_sizes",
		SchemaFilePath: schemaFilePath,
	}
}

type GeneratedCode struct {
	TypescriptCode string
	GoCode         string
	RelativePath   string
	SchemaFilePath string
}

func writeGeneratedCode(generatedCode GeneratedCode) error {
	comment := generateComment(generatedCode.SchemaFilePath)

	goPath := fmt.Sprintf("mediaserver/generated/%s.go", generatedCode.RelativePath)
	log.Printf("writing generated code to %s\n", goPath)
	err := ioutil.WriteFile(goPath, []byte(comment+generatedCode.GoCode), 0644)
	if err != nil {
		return err
	}

	tsPath := fmt.Sprintf("client/src/generated/%s.ts", generatedCode.RelativePath)
	log.Printf("writing generated code to %s\n", tsPath)
	return ioutil.WriteFile(tsPath, []byte(comment+generatedCode.TypescriptCode), 0644)
}

func generateComment(relativeFilePath string) string {
	return fmt.Sprintf(`// generated code - DO NOT EDIT!
// to change this file, change '%s'

`, relativeFilePath)
}
