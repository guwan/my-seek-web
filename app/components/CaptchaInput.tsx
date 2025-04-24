// import type {MutableRefObject} from "react";
//
//
// interface CaptchaInputValue {
//   captchaCode?: string;
//   captchaKey?: string;
// }
//
// interface CaptchaInputProps {
//   value?: CaptchaInputValue;
//   onChange?: (value: CaptchaInputValue) => void;
//   changeTimestamp?: number;//用于刷新验证码
//   className?: string;
//   formRef?: MutableRefObject<any>;
// }
//
// /**
//  * 获取验证码
//  */
// const getCaptcha = async () => {
//   const captchaKey = StringUtil.uuid(16, 16);
//   const data = await captchaUsingGET({captchaKey});
//   if (data.success) {
//     const captcha = data.data
//     return {captchaKey: captcha?.captchaKey, imageData: captcha?.imageData};
//   }
//   message.error('获取验证码失败,请重试');
//   return {};
// }
//
// const CaptchaInput: React.FC<CaptchaInputProps> = ({changeTimestamp, formRef, className}) => {
//
//   const intl = useIntl();
//   const [captchaCode, setCaptchaCode] = useState<string>('');
//   const [captchaKey, setCaptchaKey] = useState<string>('');
//   const [imageData, setImageData] = useState<string>('');
//
//   // 触发改变
//   const triggerChange = (changedValue: { captchaCode?: string; captchaKey?: string }) => {
//     if (changedValue) {
//       //onChange({captchaCode, captchaKey, ...value, ...changedValue});
//       formRef?.current?.setFieldsValue({
//         ...formRef.current?.getFieldsValue(),
//         captchaKey: changedValue.captchaKey
//       });
//     }
//   };
//
//   useEffect(() => {
//     //console.log("changeTimestamp",changeTimestamp)
//     getCaptcha().then(({captchaKey: newCaptchaKey, imageData: newImageData}) => {
//       setCaptchaKey(newCaptchaKey as string);
//       setImageData(newImageData as string);
//       setCaptchaCode('');
//       triggerChange({captchaKey: newCaptchaKey});
//     });
//   }, [changeTimestamp]);
//
//
//   // 输入框变化
//   const onChangeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const code = e.target.value || '';
//     if (StringUtil.isNotEmpty(code)) {
//       setCaptchaCode(code);
//     }
//     triggerChange({captchaCode: code, captchaKey});
//   }
//
//   // 时间类型变化
//   const onClickImage = () => {
//     getCaptcha().then(({captchaKey: newCaptchaKey, imageData: newImageData}) => {
//       setCaptchaKey(newCaptchaKey as string);
//       setImageData(newImageData as string);
//       triggerChange({captchaCode, captchaKey: newCaptchaKey});
//     });
//   };
//
//   return (
//     <div className={className}>
//       <Form.Item hidden={true} name='captchaKey'>
//         <Input/>
//       </Form.Item>
//       <Input.Group compact>
//         <Form.Item
//           name='captcha'
//           style={{width: '75%', marginRight: 5}}
//         >
//           <Input
//             size={'large'}
//             prefix={<SafetyCertificateOutlined style={{color: "rgba(0, 0, 0, 0.85)"}}/>}
//             placeholder={intl.formatMessage({
//               id: 'pages.login.imgCaptcha.placeholder',
//               defaultMessage: '请输入右侧的验证码',
//             })}
//             onChange={onChangeInput}
//           />
//         </Form.Item>
//
//         <img style={{width: '23%', height: '40px', verticalAlign: 'middle', padding: '0px 0px 0px 0px'}}
//              src={imageData} onClick={onClickImage} alt={'验证码'}/>
//       </Input.Group>
//     </div>
//   );
// };
// export default CaptchaInput;
