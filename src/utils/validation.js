export const validateMobile = (mobile) => {
    const regex = /^[6-9]\d{9}$/; // Mobile number starts with 6-9 and is 10 digits
    return regex.test(mobile);
  };
  