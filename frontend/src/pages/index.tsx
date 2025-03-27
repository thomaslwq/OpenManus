import {
  Attachments,
  Bubble,
  Conversations,
  Prompts,
  Sender,
  Welcome,
  ThoughtChain,
  useXAgent,
  useXChat,
} from '@ant-design/x';
import { CheckCircleOutlined, CloudUploadOutlined, CommentOutlined, EllipsisOutlined, FireOutlined, HeartOutlined, InfoCircleOutlined, MoreOutlined, PaperClipOutlined, PlusOutlined, ReadOutlined, ShareAltOutlined, SmileOutlined, UserOutlined } from '@ant-design/icons';
import { createStyles } from 'antd-style';
import { Card, Typography, Space, Button, Flex, type GetProp, Badge } from 'antd';
import React, { useEffect, useState } from 'react';
const { Paragraph, Text } = Typography;

const renderTitle = (icon: React.ReactElement, title: string) => (
  <Space align="start">
    {icon}
    <span>{title}</span>
  </Space>
);
const defaultConversationsItems = [
  {
    key: '0',
    label: 'What is Open Manus X?',
  },
];

const useStyle = createStyles(({ token, css }) => {
  return {
    layout: css`
      width: 100%;
      min-width: 1000px;
      box-sizing: border-box;
      height: 100vh;
      overflow-y: hidden;
      border-radius: ${token.borderRadius}px;
      display: flex;
      background: ${token.colorBgContainer};
      font-family: AlibabaPuHuiTi, ${token.fontFamily}, sans-serif;

      .ant-prompts {
        color: ${token.colorText};
      }
    `,
    menu: css`
      background: ${token.colorBgLayout}80;
      width: 300px;
      height: 100%;
      display: flex;
      flex-direction: column;
    `,
    thoughtChain: css`
      background: ${token.colorBgLayout}80;
      width: 500px;
      height: 90%;
      padding:10px;
      overflow-x: hidden;
      overflow-y: scroll;
      display: flex;
      flex-direction: column;
    `,
    conversations: css`
      padding: 0 12px;
      flex: 1;
      overflow-y: auto;
    `,
    chat: css`
      height: 100%;
      width: 100%;
      margin: 0 auto;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      padding: ${token.paddingLG}px;
      gap: 16px;
    `,
    messages: css`
      flex: 1;
    `,
    placeholder: css`
      padding-top: 32px;
    `,
    sender: css`
      box-shadow: ${token.boxShadow};
    `,
    logo: css`
      display: flex;
      height: 72px;
      align-items: center;
      justify-content: start;
      padding: 0 24px;
      box-sizing: border-box;

      img {
        width: 24px;
        height: 24px;
        display: inline-block;
      }

      span {
        display: inline-block;
        margin: 0 8px;
        font-weight: bold;
        color: ${token.colorText};
        font-size: 16px;
      }
    `,
    addBtn: css`
      background: #1677ff0f;
      border: 1px solid #1677ff34;
      width: calc(100% - 24px);
      margin: 0 12px 24px 12px;
    `,
  };
});

const placeholderPromptsItems: GetProp<typeof Prompts, 'items'> = [
  {
    key: '1',
    label: renderTitle(<FireOutlined style={{ color: '#FF4D4F' }} />, 'Hot Topics'),
    description: 'What are you interested in?',
    children: [
      {
        key: '1-1',
        description: `What's new in X?`,
      },
      {
        key: '1-2',
        description: `What's AGI?`,
      },
      {
        key: '1-3',
        description: `Where is the doc?`,
      },
    ],
  },
];

const senderPromptsItems: GetProp<typeof Prompts, 'items'> = [
  {
    key: '1',
    description: '最新十条热门新闻',
    icon: <FireOutlined style={{ color: '#FF4D4F' }} />,
  }
];

const roles: GetProp<typeof Bubble.List, 'roles'> = {
  ai: {
    placement: 'start',
    typing: true,
    avatar: { icon: <UserOutlined />, style: { background: '#fde3cf' } },
  },
  user: {
    placement: 'end',
    typing: true,
    avatar: { icon: <UserOutlined />, style: { background: '#e8f4ff' } },
  },
  suggestion: {
    placement: 'start',
    avatar: { icon: <UserOutlined />, style: { visibility: 'hidden' } },
    variant: 'borderless',
    messageRender: (content) => (
      <Prompts
        vertical
        items={(content as any as string[]).map((text) => ({
          key: text,
          icon: <SmileOutlined style={{ color: '#FAAD14' }} />,
          description: text,
        }))}
      />
    ),
  },
  file: {
    placement: 'start',
    avatar: { icon: <UserOutlined />, style: { visibility: 'hidden' } },
    variant: 'borderless',
    messageRender: (items: any) => (
      <Flex vertical gap="middle">
        {(items as any[]).map((item) => (
          <Attachments.FileCard key={item} item={{
            uid: '9',
            name: 'markdown-file.md',
            size: 999999,
            description: 'Custom description here',
          }} />
        ))}
      </Flex>
    ),
  },
};
type AgentUserMessage = {
  type: 'user';
  content: string;
};

type AgentAIMessage = {
  type: 'ai';
  content?: string;
  list?: (
    | {
      type: 'text';
      content: string;
    }
    | {
      type: 'suggestion';
      content: string[];
    }
  )[];
};

type AgentMessage = AgentUserMessage | AgentAIMessage;

type BubbleMessage = {
  role: string;
};

const sampleThoughtChainItems: GetProp<typeof ThoughtChain, 'items'> = [
  {
    title: '用户输入',
    description: "最近熱門信息",
    icon: <CheckCircleOutlined />,
    status: 'pending',
    extra: <Button type="text" icon={<MoreOutlined />} />,
    content: (
      <Typography>
        <Paragraph>
          用户输入: "最近熱門信息"
        </Paragraph>
      </Typography>
    ),
  },
  {
    title: 'Processing Request',
    description: 'Processing your request...',
    icon: <InfoCircleOutlined />,
    status: 'error',
    extra: <Button type="text" icon={<MoreOutlined />} />,
    content: (
      <Typography>
        <Paragraph>
          Processing your request...
        </Paragraph>
      </Typography>
    ),
  },
  {
    title: 'Executing Step 1/20',
    description: 'Navigating to https://news.google.com/',
    icon: <InfoCircleOutlined />,
    status: 'success',
    extra: <Button type="text" icon={<MoreOutlined />} />,
    content: (
      <Typography>
        <Paragraph>
          Navigated to https://news.google.com/
        </Paragraph>
      </Typography>
    ),
  },
  {
    title: 'Executing Step 2/20',
    description: 'Extracting top 10 news headlines',
    icon: <InfoCircleOutlined />,
    status: 'success',
    extra: <Button type="text" icon={<MoreOutlined />} />,
    content: (
      <Typography>
        <Paragraph>
          Extracted from page:
          <ul>
            <li>南韓山火死者增至 19 人 灌救直昇機墜毀機師殉難</li>
            <li>南韓山火增至最少24死 學校及體育館成為災民臨時安置中心</li>
            <li>參與韓國山火救援的直升機墜毁飛行員遇難- 國際 - 香港文匯網</li>
            <li>韓山火焚千年古剎威脅世遺- 20250326 - 公民</li>
            <li>急症室第三類病人收費將不豁免 高拔陞：為免不必要爭拗</li>
            <li>醫療費用減免︱二人家庭入息限額放寬至 22600 元 資產上限最高 72 萬 明年推網上申請︱Yahoo</li>
            <li>門診處方藥「最多4周」惹關注 當局澄清4周僅為收費單位</li>
            <li>公立醫院收費改革｜盧寵茂：急症室成本高 需按「輕症共付」原則分擔</li>
            <li>消息：長江和記推進巴拿馬運河港口交易</li>
            <li>烏克蘭戰爭：美國宣布俄烏同意黑海海上停火，俄進一步要求取消SWIFT在內多項制裁</li>
          </ul>
        </Paragraph>
      </Typography>
    ),
  },
  {
    title: 'Task Completed',
    description: 'The interaction has been completed with status: success',
    icon: <InfoCircleOutlined />,
    status: 'success',
    extra: <Button type="text" icon={<MoreOutlined />} />,
    footer: <Button block>文件下载</Button>,
    content: (
      <Typography>
        <Paragraph>
          The interaction has been completed with status: success
        </Paragraph>
      </Typography>
    ),
  },
]
const Independent: React.FC = () => {
  const { styles } = useStyle();

  const [headerOpen, setHeaderOpen] = React.useState(false);
  const [content, setContent] = React.useState('');
  const [conversationsItems, setConversationsItems] = React.useState(defaultConversationsItems);
  const [activeKey, setActiveKey] = React.useState(defaultConversationsItems[0].key);
  const [attachedFiles, setAttachedFiles] = React.useState<GetProp<typeof Attachments, 'items'>>([]);
  const [thoughtChainItems, setThoughtChainItems] = React.useState<GetProp<typeof ThoughtChain, 'items'>>([]);
  const thoughtChainRef = React.useRef<HTMLDivElement | null>(null);

  const sleep = (timeout) => new Promise((resolve) => setTimeout(resolve, timeout || 1000));

  const [agent] = useXAgent<AgentMessage>({
    request: async ({ message }, { onSuccess }) => {
      await sleep();

      const { content } = message || {};
      onSuccess(
        {

          type: 'ai',
          list: [
            {
              type: 'ai',
              content: '南韓山火死者增至 19 人 灌救直昇機墜毀機師殉難',
            },
            {
              type: 'ai',
              content: '南韓山火增至最少24死 學校及體育館成為災民臨時安置中心',
            },
            {
              type: 'ai',
              content: '參與韓國山火救援的直升機墜毁飛行員遇難- 國際 - 香港文匯網',
            },
            {
              type: 'ai',
              content: '韓山火焚千年古剎威脅世遺- 20250326 - 公民',
            },
            {
              type: 'ai',
              content: '急症室第三類病人收費將不豁免 高拔陞：為免不必要爭拗',
            },
            {
              type: 'ai',
              content: '醫療費用減免︱二人家庭入息限額放寬至 22600 元 資產上限最高 72 萬 明年推網上申請︱Yahoo',
            },
            {
              type: 'ai',
              content: '門診處方藥「最多4周」惹關注 當局澄清4周僅為收費單位',
            },
            {
              type: 'ai',
              content: '公立醫院收費改革｜盧寵茂：急症室成本高 需按「輕症共付」原則分擔',
            },
            {
              type: 'ai',
              content: '消息：長江和記推進巴拿馬運河港口交易',
            },
            {
              type: 'ai',
              content: '烏克蘭戰爭：美國宣布俄烏同意黑海海上停火，俄進一步要求取消SWIFT在內多項制裁',
            },
          ],

        });

      for (let i = 0; i < sampleThoughtChainItems.length; i++) {
        setThoughtChainItems((prevItems) => [
          ...prevItems,
          sampleThoughtChainItems[i]
        ]);
        await sleep(2000);
      }
    },
  });

  const { onRequest, parsedMessages, setMessages } = useXChat<AgentMessage, BubbleMessage>({
    agent,
    defaultMessages: [
      {
        id: 'init',
        message: {
          type: 'ai',
          content: 'Hello, what can I do for you?',
        },
        status: 'success',
      },
    ],
    requestPlaceholder: {
      type: 'ai',
      content: 'Waiting...',
    },
    parser: (agentMessages) => {
      const list = agentMessages.content ? [agentMessages] : (agentMessages as AgentAIMessage).list;

      return (list || []).map((msg) => ({
        role: msg.type,
        content: msg.content,
      }));
    },
  });
  React.useEffect(() => {
    if (thoughtChainRef.current) {
      thoughtChainRef.current.scrollTop = thoughtChainRef.current.scrollHeight;
    }
  }, [thoughtChainItems]);
  useEffect(() => {
    if (activeKey !== undefined) {
      setMessages([]);
      setThoughtChainItems([]);
    }
  }, [activeKey]);

  const onSubmit = (nextContent: string) => {
    if (!nextContent) return;
    onRequest({
      type: 'user',
      content: nextContent,
    });
    // setContent('');
  };

  const onPromptsItemClick: GetProp<typeof Prompts, 'onItemClick'> = (info) => {
    onRequest({
      type: 'user',
      content: info.data.description || '',
    });
  };

  const onAddConversation = () => {
    setConversationsItems([
      ...conversationsItems,
      {
        key: `${conversationsItems.length}`,
        label: `New Conversation ${conversationsItems.length}`,
      },
    ]);
    setActiveKey(`${conversationsItems.length}`);
  };

  const onConversationClick: GetProp<typeof Conversations, 'onActiveChange'> = (key) => {
    setActiveKey(key);
  };

  const handleFileChange: GetProp<typeof Attachments, 'onChange'> = (info) =>
    setAttachedFiles(info.fileList);

  const placeholderNode = (
    <Space direction="vertical" size={16} className={styles.placeholder}>
      <Welcome
        variant="borderless"
        icon="https://mdn.alipayobjects.com/huamei_iwk9zp/afts/img/A*s5sNRo5LjfQAAAAAAAAAAAAADgCCAQ/fmt.webp"
        title="Hello, I'm Open Manus X"
        description="Base on Open Manus, AGI product interface solution, create a better intelligent vision~"
        extra={
          <Space>
            <Button icon={<ShareAltOutlined />} />
            <Button icon={<EllipsisOutlined />} />
          </Space>
        }
      />
      <Prompts
        title="Do you want?"
        items={placeholderPromptsItems}
        styles={{
          list: {
            width: '100%',
          },
          item: {
            flex: 1,
          },
        }}
        onItemClick={onPromptsItemClick}
      />
    </Space>
  );

  const attachmentsNode = (
    <Badge dot={attachedFiles.length > 0 && !headerOpen}>
      <Button type="text" icon={<PaperClipOutlined />} onClick={() => setHeaderOpen(!headerOpen)} />
    </Badge>
  );

  const senderHeader = (
    <Sender.Header
      title="Attachments"
      open={headerOpen}
      onOpenChange={setHeaderOpen}
      styles={{
        content: {
          padding: 0,
        },
      }}
    >
      <Attachments
        beforeUpload={() => false}
        items={attachedFiles}
        onChange={handleFileChange}
        placeholder={(type) =>
          type === 'drop'
            ? { title: 'Drop file here' }
            : {
              icon: <CloudUploadOutlined />,
              title: 'Upload files',
              description: 'Click or drag files to this area to upload',
            }
        }
      />
    </Sender.Header>
  );

  const logoNode = (
    <div className={styles.logo}>
      <img
        src="https://mdn.alipayobjects.com/huamei_iwk9zp/afts/img/A*eco6RrQhxbMAAAAAAAAAAAAADgCCAQ/original"
        draggable={false}
        alt="logo"
      />
      <span>Open Manus X</span>
    </div>
  );

  return (
    <div className={styles.layout}>
      <div className={styles.menu}>
        {/*  Logo */}
        {logoNode}
        {/* 会话区 */}
        <Button
          onClick={onAddConversation}
          type="link"
          className={styles.addBtn}
          icon={<PlusOutlined />}
        >
          New Conversation
        </Button>
        {/* 对话列表 */}
        <Conversations
          items={conversationsItems}
          className={styles.conversations}
          activeKey={activeKey}
          onActiveChange={onConversationClick}
        />
      </div>
      <div className={styles.chat}>
        {/* 对话内容 */}
        <Bubble.List
          items={parsedMessages.map(({ id, message, status }) => ({
            key: id,
            loading: status === 'loading',
            ...message,
          }))}
          roles={roles}
          className={styles.messages}
        />
        {/* 提示 */}
        <Prompts items={senderPromptsItems} onItemClick={onPromptsItemClick} />
        {/* 发送框 */}
        <Sender
          value={content}
          header={senderHeader}
          onSubmit={onSubmit}
          onChange={setContent}
          prefix={attachmentsNode}
          loading={agent.isRequesting()}
          className={styles.sender}
        />
      </div>
      {
        thoughtChainItems.length ? <div className={styles.thoughtChain} ref={thoughtChainRef}> {/* 思维链 */}
          <ThoughtChain items={thoughtChainItems} />
        </div> : ''
      }

    </div>
  );
};

export default Independent;

