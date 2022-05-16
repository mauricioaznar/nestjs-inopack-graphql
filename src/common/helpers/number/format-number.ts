export const formatFloat = (x: any, digits = 2) => {
    if (x < 0.01 && x > -0.01) {
        x = 0;
    }
    if (isNaN(x)) {
        return '-';
    }
    return x
        .toFixed(digits)
        .toString()
        .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};
