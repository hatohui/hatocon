import Image from "next/image";

const AppIcon = ({ size = 32 }) => {
  return (
    <Image
      src="/svgs/luggage.svg"
      alt="App Icon"
      width={size}
      height={size}
      className="rounded-md"
    />
  );
};

export default AppIcon;
