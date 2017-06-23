const cv = require('opencv');
const fs = require('fs');
const Jimp = require('jimp');

const height_crop = 15, width_crop = 10;
const nguong = 128;
const whitePixel = Jimp.rgbaToInt(255, 255, 255, 255);
const blackPixel = Jimp.rgbaToInt(0, 0, 0, 255);
const WHITE = [255, 255, 255];
const GREEN = [0, 255, 0];
const BLACK = [0, 0, 0];
const thickness = 1;
const Promise = require("bluebird");


module.exports = {
    PreProcess,
}

function PreProcess(imgDir, imgName, data) {
    return new Promise(function (resolve, reject) {
        Jimp.read(imgDir + imgName, function (err, imgJimp) {
            if (err) {
                return reject(err);
            }
            imgJimp.greyscale(function (err, imgGray) {
                imgGray.getBuffer(Jimp.AUTO, function (err, buff) {
                    if (err) {
                        return reject(err);
                    }
                    cv.readImage(buff, function (err, img) {
                        if (err) {
                            return reject(err);
                        }
                        const width = img.width();
                        const height = img.height();

                        let imgSave = img.copy();

                        if (width < 1 || height < 1) {
                            reject(new Error('Image has no size'));
                        }
                        // Chuyen ve anh xam
                        img.convertGrayscale();
                        
                        // img.save(imgDir + '1_' + imgName);

                        // lọc nhiễu
                        // img.medianBlur(1);

                        // img.gaussianBlur([1, 5]);
                        img.gaussianBlur([3, 3]);
                        // img.save(imgDir + '2_' + imgName);


                        //  Xac dinh duong net
                        const lowThresh = data.lowThresh || 0; // càng lớn càng mất nét
                        const highThresh = data.highThresh || 120; // cang lon loc cang manh
                        img.canny(lowThresh, highThresh);
                        // img.save(imgDir + '3_' + imgName);

                        // lam beo chu
                        const iterations = 1; // cang lon chu cang beo'
                        img.dilate(iterations);
                        img.erode(1); // xói mòn
                        // img.save(imgDir + '4_' + imgName);

                        let contours = img.findContours();

                        let listAllBound = [];
                        let listBoundAccept = []; // Các contour chấp nhận
                        let listBoundDelete = []; // Các contour bị loại bỏ (bị trùng)

                        for (let i = 0; i < contours.size(); i++) {
                            let bound = contours.boundingRect(i);

                            if (bound.width > 15 && bound.height > 25 && bound.width < 160 && bound.height < 160) {
                                listAllBound.push(bound);
                            }
                        }

                        let checkIsDeleteBound = function (bound) {
                            // bị loại nếu tồn tại cặp toạ độ bound.x > x' && bound.y > y' && bound.width < width', bound.height < height'
                            let isDelete = null, index;
                            listAllBound.forEach((item, i) => {
                                if (bound.x > item.x && bound.y > item.y &&
                                    (bound.x + bound.width) < (item.x + item.width)
                                    && (bound.y + bound.height) < (item.y + item.height)) {
                                    isDelete = item;
                                    index = i;
                                }
                            });
                            return isDelete;
                        }

                        listAllBound.forEach(function (item, index) {
                            if (checkIsDeleteBound(item) != null) {
                                listBoundDelete.push(item)
                            }
                        })

                        // listBoundDelete.forEach(function (item) {
                        //     imgSave.rectangle([item.x, item.y], [item.width, item.height], BLACK, 1);
                        // })

                        listBoundAccept = listAllBound.map(item => {

                            let isExitInListDelete = listBoundDelete.find(itemDelete => {
                                return (item.x == itemDelete.x && item.y == itemDelete.y && item.width == itemDelete.width && item.height == itemDelete.height)
                            });
                            if (isExitInListDelete) {
                                return null;
                            }
                            else {
                                return item;
                            }
                        })

                        // CROP IMAGE
                        if (!fs.existsSync(data.dirDist)) {
                            fs.mkdirSync(data.dirDist)
                        }
                        listBoundAccept.forEach(function (item, index) {
                            if (item) {

                                var imgCrop = imgSave.crop(item.x, item.y, item.width, item.height);

                                imgCrop.resize(width_crop, height_crop);

                                var path_save = data.dirDist + data.character + '_' + index + '.jpg';

                                imgCrop.save(path_save);

                                imgSave.rectangle([item.x, item.y], [item.width, item.height], GREEN, 1);

                            }
                        })
                        imgSave.save(imgDir + '5_' + imgName);
                    });
                });
            })
        })
    })
}
PreProcess('test/bang chu cai/', 'a.jpg', {
    character: 'a',
    dirDist: 'test/a/'
})