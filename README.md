# meteorological_visualizer

Cesium(https://github.com/CesiumGS/cesium)のtile arrowプラグイン。

tile arrowを読み込んでCesiumに表示させるプラグインの作成を目標とする。

## 出来ているもの

* arrowファイルを読み込んで、Cesiumで表示する機能を作成。tile形式のデータには未対応
* tileにしたpngを読み込む機能を作成(urlimageryprovider2.js)

## 作っている途中のもの

* 読み込んだ後のtile形式のarrowファイルの中身を描画する機能


## 推測的なもの(小関)

* 解決策?(https://github.com/CesiumGS/cesium/issues/2132)
* 「出来ているもの」で作ったarrowファイルの描画機能はentityで作成している。
しかし、現在拡張しようとしているrequest_imageはcanvasのhtmlを返すことが期待されている。(canvasを返さないとエラーになる？)
