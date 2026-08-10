# -*- coding: utf-8 -*-
"""
Resize image folder and place watermark.

This python script takes all jpg/jpeg files in a folder, resizes them and
puts a watermark in the right lower corner. The watermark must be named
<watermark.png> and must be located in the same folder as this script.

Example:
    This script uses the path given in arguments. In case no parameter is
    given it uses the current path.

        $ python resize_and_watermark.py /path/to/folder

Requires: pip install pillow
"""
import os
import argparse
from PIL import Image


def resizeImage(file, max_side_length):
    """
    Function: Resize Image

    Description:
        Resizes an image so its longer side matches max_side_length,
        scaling the other side proportionally.

    Parameter:
        max_side_length: max side length of resized picture (horizontal or vertical)

    Return:
        Resized image of type Image.
    """
    image = Image.open(file)
    imageWidth, imageHeight = image.size

    if imageWidth > imageHeight:
        width = max_side_length
        height = round(imageHeight * width / imageWidth)
    else:
        height = max_side_length
        width = round(imageWidth * height / imageHeight)

    return image.resize((width, height), Image.Resampling.LANCZOS)


def addWaterMark(file, watermark, offset=10):
    """
    Function: Add Watermark

    Description:
        Places the watermark on the image file. Right lower corner
        with an offset.

    Parameter:
        file:       image file (must be of type Image)
        watermark:  watermark image (must be of type Image, RGBA)
        offset:     offset to right lower corner of image

    Return:
        Watermarked image
    """
    image = file.convert("RGB")

    imageWidth, imageHeight = image.size
    waterWidth, waterHeight = watermark.size

    image.paste(watermark, (imageWidth - offset - waterWidth, imageHeight - offset - waterHeight), watermark)

    return image


def main():
    """
    Function: Main function

    Description:
        Read arguments
        Parse arguments
        Create subdirectory
        Loop through destination directory
        Resize image
        Watermark image
        Save image in subdirectory
    """
    parser = argparse.ArgumentParser(description="Automates basic image manipulation.")
    parser.add_argument("directory", nargs="?", default=".", help="A directory of images to process")
    args = parser.parse_args()

    print("Initial working directory: " + os.getcwd())

    # Read watermark before changing working directory
    watermark_path = os.path.join(os.path.dirname(os.path.realpath(__file__)), "watermark.png")
    watermark = Image.open(watermark_path).convert("RGBA")

    # Change directory either to default or to argument
    os.chdir(args.directory)
    print("New working directory: " + os.getcwd())

    # Create subdirectory (no error if it already exists)
    output_dir = os.path.join(os.getcwd(), "hp")
    os.makedirs(output_dir, exist_ok=True)

    # Go through folder (no subdirs), match .jpg and .jpeg case-insensitively
    for filename in os.listdir():
        if filename.lower().endswith((".jpg", ".jpeg")):
            resized_image = resizeImage(filename, max_side_length=1024)
            watermarked_image = addWaterMark(resized_image, watermark)
            watermarked_image.save(os.path.join(output_dir, "res_" + filename))
            print("Processed file: " + filename)


if __name__ == "__main__":
    main()
