module.exports = {
  extend: '@apostrophecms/widget-type',
  options: {
    label: 'Image'
  },
  fields: {
    add: {
      _image: {
        type: 'relationship',
        label: 'Image',
        max: 1,
        required: true,
        withType: '@apostrophecms/image'
      }
    }
  }
};
