define([
    'backbone',
    'jquery',
    'mustache'
], function (
    Backbone,
    $,
    Mustache
) {
    var ImagesView = Backbone.View.extend({
        el: 'ol.image-stack',
        template: document.getElementById('template-stack-item').innerHTML,
        events: {
            'click .remove': 'removeImage',
            'change .toggle': 'toggleImageVisibility'
        },
        initialize: function (options) {
            this.images = options.images;
            this.listenTo(this.images, 'add remove reset', this.render);
            this.listenTo(this.images, 'change:thumbnailURL', this.updateThumb);
        },
        render: function () {
            this.$el.parent().toggleClass('has-images', this.images.length > 0);
            this.el.innerHTML = Mustache.render(
                this.template,
                { images: this.images.toJSON() }
            );

            return this;
        },
        updateThumb: function (model, url) {
            var $li = this.$('#thumbnail-' + model.id);
            var $image = $li.find('img');

            $image.attr('src', url);
            $li.toggleClass('loading', url === '');

        },
        toggleImageVisibility: function (evt) {
            var visible = evt.target.checked;
            var id = evt.target.getAttribute('data-id');
            var model = this.images.findWhere({ id: id });
            model.set('visible', visible);
            $(evt.target).closest('li').toggleClass('using', visible);
        },

        removeImage: function (evt) {
            var id = evt.target.getAttribute('data-id');
            this.images.remove(id);
        }
    });

    return ImagesView;
});
