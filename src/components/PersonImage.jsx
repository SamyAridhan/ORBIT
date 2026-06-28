import otherPerson from "../../assets/otherPerson.png";
import userPerson from "../../assets/userPerson.png";

export default function PersonImage({ isUser=false, size }) {
  return <img
    aria-hidden="true"
    alt=""
    draggable="false"
    height={size}
    src={isUser?userPerson:otherPerson}
    width={size}
    className="shrink-0 select-none object-contain"
    style={{width:size,height:size}}
  />;
}
