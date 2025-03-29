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
import { createTask, getTaskEvents } from '@/api/taskApi';
const { Paragraph, Text } = Typography;
import agentXSVG from '@/assets/agent-x.svg';
const renderTitle = (icon: React.ReactElement, title: string) => (
  <Space align="start">
    {icon}
    <span>{title}</span>
  </Space>
);
const defaultConversationsItems = [
  {
    key: '0',
    label: 'New Conversation',
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
      width: 800px;
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
type AgentAIItemMessage = {
  type: 'ai';
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

const AgentX: React.FC = () => {
  const { styles } = useStyle();

  const [headerOpen, setHeaderOpen] = React.useState(false);
  const [content, setContent] = React.useState('');
  const [conversationsItems, setConversationsItems] = React.useState(defaultConversationsItems);
  const [activeKey, setActiveKey] = React.useState(defaultConversationsItems[0].key);
  const [attachedFiles, setAttachedFiles] = React.useState<GetProp<typeof Attachments, 'items'>>([]);
  const [thoughtChainItems, setThoughtChainItems] = React.useState<GetProp<typeof ThoughtChain, 'items'>>([]);
  const thoughtChainRef = React.useRef<HTMLDivElement | null>(null);

  const [agent] = useXAgent<AgentMessage>({
    request: async ({ message }, { onSuccess }) => {
      const { content } = message || {};

      try {
        // 创建任务
        const taskId = await createTask(content);

        // 获取任务事件流
        const eventSource = await getTaskEvents(taskId);
        onSuccess(taskId)
        const handleEvent = (event: MessageEvent, type: string) => {
          try {
            const data = JSON.parse(event.data);
            let newMessage: { type: 'text'; content: string } = {
              type: 'text',
              content: JSON.stringify(data),
            };
            if (type === 'status') {
              // 创建新的消息对象
              // 处理任务状态
              setThoughtChainItems((prevItems) => [
                ...prevItems,
                {
                  title: `Step ${data.steps.length}`,
                  description: data.status,
                  icon: <InfoCircleOutlined />,
                  status: 'success',
                  content: (
                    <Typography>
                      <Paragraph>{data.status}</Paragraph>
                    </Typography>
                  ),
                },
              ]);
            } else if (type === 'think') {
              // 处理思考步骤
              setThoughtChainItems((prevItems) => [
                ...prevItems,
                {
                  title: 'Thinking',
                  description: data.result,
                  icon: <InfoCircleOutlined />,
                  status: 'processing',
                  content: (
                    <Typography>
                      <Paragraph>{data.result}</Paragraph>
                    </Typography>
                  ),
                },
              ]);
            } else if (type === 'tool') {
              // 处理工具执行步骤
              setThoughtChainItems((prevItems) => [
                ...prevItems,
                {
                  title: 'Executing Tool',
                  description: data.result,
                  icon: <InfoCircleOutlined />,
                  status: 'processing',
                  content: (
                    <Typography>
                      <Paragraph>{data.result}</Paragraph>
                    </Typography>
                  ),
                },
              ]);
            } else if (type === 'act') {
              // 处理行动步骤
              setThoughtChainItems((prevItems) => [
                ...prevItems,
                {
                  title: 'Taking Action',
                  description: data.result,
                  icon: <InfoCircleOutlined />,
                  status: 'processing',
                  content: (
                    <Typography>
                      <Paragraph>{data.result}</Paragraph>
                    </Typography>
                  ),
                },
              ]);
            } else if (type === 'run') {
              // 处理运行步骤
              setThoughtChainItems((prevItems) => [
                ...prevItems,
                {
                  title: 'Running Step',
                  description: data.result,
                  icon: <InfoCircleOutlined />,
                  status: 'processing',
                  content: (
                    <Typography>
                      <Paragraph>{data.result}</Paragraph>
                    </Typography>
                  ),
                },
              ]);
            } else if (type === 'complete') {
              // 处理任务完成事件
              setThoughtChainItems((prevItems) => [
                ...prevItems,
                {
                  title: 'Task Completed',
                  description: data.result,
                  icon: <InfoCircleOutlined />,
                  status: 'success',
                  content: (
                    <Typography>
                      <Paragraph>{data.result}</Paragraph>
                    </Typography>
                  ),
                },
              ]);
            } else if (type === 'error') {
              // 处理任务错误事件
              setThoughtChainItems((prevItems) => [
                ...prevItems,
                {
                  title: 'Task Error',
                  description: data.message,
                  icon: <InfoCircleOutlined />,
                  status: 'error',
                  content: (
                    <Typography>
                      <Paragraph>{data.message}</Paragraph>
                    </Typography>
                  ),
                },
              ]);
            }
            // 使用 setMessages 更新对话内容
            setMessages((prevMessages) => [
              ...prevMessages,
              {
                message: newMessage,
                status: 'success',
              },
            ]);
          } catch (e) {
            console.error(`Error handling ${type} event:`, e);
          }
        };

        const eventTypes = ['status', 'think', 'tool', 'act', 'log', 'run', 'message', 'complete', 'error'];
        eventTypes.forEach((type) => {
          eventSource.addEventListener(type, (event) => handleEvent(event, type));
        });

        eventSource.onerror = () => {
          eventSource.close();
        };
      } catch (error) {
        console.error('Error processing task:', error);
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
        src={agentXSVG}
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
        {/* 占位 */}
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
          // loading={agent.isRequesting()}
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

export default AgentX;

