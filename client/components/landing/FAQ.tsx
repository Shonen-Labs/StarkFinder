
import Accordion from "./accordion";
const featureListData = [
  {
    name: "Lorem ipsum dolor sit amet consectetur. Viverra.",
    description: "Lorem ipsum dolor sit amet consectetur. In augue ipsum tellus ultrices. Ac pharetra ultrices consectetur consequat tellus massa. Nec aliquam cras sagittis duis sed euismod arcu hac. Ornare amet ligula ornare lacus aliquam aenean. Eu lacus imperdiet urna amet congue adipiscing. Faucibus magna nisl ullamcorper in facilisis consequat aliquam. Id placerat dui habitasse quisque nisl tincidunt facilisi mi id. Dictum elit velit.",
  },
  {
    name: "Lorem ipsum dolor sit amet consectetur. Viverra.",
    description: "Lorem ipsum dolor sit amet consectetur. In augue ipsum tellus ultrices. Ac pharetra ultrices consectetur consequat tellus massa. Nec aliquam cras sagittis duis sed euismod arcu hac. Ornare amet ligula ornare lacus aliquam aenean. Eu lacus imperdiet urna amet congue adipiscing. Faucibus magna nisl ullamcorper in facilisis consequat aliquam. Id placerat dui habitasse quisque nisl tincidunt facilisi mi id. Dictum elit velit.",

  },
  {
    name: "Lorem ipsum dolor sit amet consectetur. Viverra.",
    description: "Lorem ipsum dolor sit amet consectetur. In augue ipsum tellus ultrices. Ac pharetra ultrices consectetur consequat tellus massa. Nec aliquam cras sagittis duis sed euismod arcu hac. Ornare amet ligula ornare lacus aliquam aenean. Eu lacus imperdiet urna amet congue adipiscing. Faucibus magna nisl ullamcorper in facilisis consequat aliquam. Id placerat dui habitasse quisque nisl tincidunt facilisi mi id. Dictum elit velit.",

  },
  {
    name: "Lorem ipsum dolor sit amet consectetur. Viverra.",
    description: "Lorem ipsum dolor sit amet consectetur. In augue ipsum tellus ultrices. Ac pharetra ultrices consectetur consequat tellus massa. Nec aliquam cras sagittis duis sed euismod arcu hac. Ornare amet ligula ornare lacus aliquam aenean. Eu lacus imperdiet urna amet congue adipiscing. Faucibus magna nisl ullamcorper in facilisis consequat aliquam. Id placerat dui habitasse quisque nisl tincidunt facilisi mi id. Dictum elit velit.",

  },
];
export default function FAQ() {
  return (
    <div className="relative py-20 md:py-32 bg-[#040F15] w-full min-h-[500px]">
      <div className="w-full h-full z-30 flex items-center justify-center">
        <div className="w-[90%] max-w-[1000px] mx-auto flex flex-col gap-12 ">
          <div className="w-full h-full flex flex-col gap-8 lg:items-center lg:justify-center">
            <h2 className="text-4xl lg:text-5xl lg:text-center font-bold text-white">
              Frequently asked Questions
            </h2>
            <p className="text-base text-[#D0D6E0] lg:max-w-[600px] lg:text-center lg:mx-auto">
              We know you might have a few questions—here are some of the most
              common ones about StarkFinder and how it can help you navigate the
              Starknet ecosystem
            </p>
          </div>
          <div className="grid lg:px-6 lg:grid-cols-1 gap-8">
            {featureListData?.map((data, index) => {
              return <Accordion key={index} item={data} index={index} />;
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
