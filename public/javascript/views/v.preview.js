define([
    'backbone',
    'models/m.preview'
], function (
    Backbone,
    PreviewModel
) {
    var PreviewView = Backbone.View.extend({
        el: 'canvas.preview',
        model: new PreviewModel(),
        initialize: function (options) {
            this.images = options.images;
            this.listenTo(this.images, 'imagesLoaded remove change:visible', this.render);
        },
        render: function () {
            //var bufferCanvas = this.model.get('canvas');
            //var bufferCtx = bufferCanvas.getContext('2d');
            var outputCtx = this.el.getContext('2d');
            var firstImage;
            var alpha;

            if (this.images.length === 0) {
                return this;
            }

            alpha = Math.floor(255 / this.images.length);
            firstImage = this.images.at(0).get('image');

            if (!firstImage) {
                return this;
            }

            this.el.width = /*bufferCanvas.width =*/ firstImage.naturalWidth;
            this.el.height = /*bufferCanvas.height =*/ firstImage.naturalHeight;

            outputCtx.clearRect(0, 0, this.el.width, this.el.height);
            this.images.each(function (model) {
                var canvas = model.get('canvas');
                var offset = model.get('offset');
                if (canvas && model.get('visible')) {
                    model.modifyAlpha(alpha);
                    outputCtx.drawImage(canvas, offset.x, offset.y);
                }
            });

            //outputCtx.drawImage(bufferCanvas, 0, 0);

            return this;
        }
    });

    return PreviewView;
});
